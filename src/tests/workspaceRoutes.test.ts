// eslint-disable-next-line import/no-extraneous-dependencies
import Redis from 'ioredis';
// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { getRepository, Connection } from 'typeorm';

import { AuthenticationController, WorkspaceController } from '../controllers';
import { RedisService, UserService, WorkspaceService } from '../services';
import { User, Workspace } from '../entity';
import App from '../App';
import { createTypeormConnection } from '../utils';

describe('Workspace Routes', () => {
  let app: App;
  let connection: Connection;
  // use a single user for all the tests
  let userInDB: User;
  // keep track of the session cookie
  let sessionCookie: string;

  beforeAll(async () => {
    connection = await createTypeormConnection();
    app = new App([
      new AuthenticationController(new UserService(getRepository<User>(User))),
      new WorkspaceController(
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User)),
        new WorkspaceService(getRepository<Workspace>(Workspace))
      ),
    ]);

    const user = {
      email: 'testemail@email.com',
      username: 'testuser',
      password: 'bestpassword',
    };

    userInDB = await connection
      .getRepository<User>(User)
      .create(user)
      .save();

    const response = await request(app.app)
      .post('/api/auth/login')
      .send(user)
      .set('Accept', 'application/json');

    // eslint-disable-next-line prefer-destructuring
    sessionCookie = response.header['set-cookie'][0];
  });

  afterEach(async () => {
    await connection
      .getRepository<Workspace>(Workspace)
      .query('DELETE FROM workspaces');
  });

  afterAll(async () => {
    await connection.getRepository<User>(User).query('DELETE FROM users');
    await connection.close();
  });

  describe('POST /api/workspaces', () => {
    it('should fail when request is missing session cookie', async () => {
      const workspace = {
        name: 'first workpace test',
        owner: userInDB.id,
      };
      const response = await request(app.app)
        .post('/api/workspaces')
        .send(workspace)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully create a workspace', async () => {
      const workspace = {
        name: 'first workpace test',
        owner: userInDB.id,
      };
      const received = {
        message: 'Workspace Created',
        workspace: { name: workspace.name },
      };
      const response = await request(app.app)
        .post('/api/workspaces')
        .send(workspace)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: response.body.message,
        workspace: { name: response.body.workspace.name },
      };

      expect(received).toStrictEqual(expected);
    });

    it('should fail when trying to create a workspace and no user is found that matches the id', async () => {
      const workspace = {
        name: 'second workpace test',
        owner: 652626,
      };
      const response = await request(app.app)
        .post('/api/workspaces')
        .send(workspace)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(404);
      const expected = {
        error: 'No user exists with that id',
      };

      expect(response.body).toStrictEqual(expected);
    });
  });

  describe('PUT /api/workspaces/:workspaceId', () => {
    it('should fail when request is missing session cookie', async () => {
      const teammatesToAdd = ['test', 'fails'];
      const response = await request(app.app)
        .put('/api/workspaces/1')
        .send(teammatesToAdd)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toEqual(expected);
    });

    it('should successfully update a workspace.teammates when teammate usernames are in db', async () => {
      const workspace = {
        name: 'anothertesting workpace test',
        owner: userInDB.id,
        teammates: [userInDB],
      };
      const userOne = {
        email: 'useruseusur@email.com',
        password: 'iajgiajg',
        username: 'ojagah45j3j5',
      };
      const userTwo = {
        email: 'akgjagjai@email.com',
        password: 'userTgjiajgiajwo',
        username: 'userTajgiaiiijgijwo',
      };

      // need more users in the db
      const userOneInDB = await connection
        .getRepository<User>(User)
        .create(userOne)
        .save();
      const userTwoInDB = await connection
        .getRepository<User>(User)
        .create(userTwo)
        .save();

      // remove hashPasswords
      delete userOneInDB.hashPassword;
      delete userTwoInDB.hashPassword;

      // remove passwords
      delete userOneInDB.password;
      delete userTwoInDB.password;

      // change 'createdAt', and 'updatedAt' from to string
      (userOneInDB as any).createdAt = userOneInDB.createdAt.toISOString();
      (userOneInDB as any).updatedAt = userOneInDB.updatedAt.toISOString();
      (userTwoInDB as any).createdAt = userTwoInDB.createdAt.toISOString();
      (userTwoInDB as any).updatedAt = userTwoInDB.updatedAt.toISOString();

      // save a workspace to the db
      const workspaceToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);

      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await connection
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = [userOne.username, userTwo.username];
      const response = await request(app.app)
        .put(`/api/workspaces/${workspaceInDB.id}`)
        .send(teammatesToAdd)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        message: 'Member/s Added',
        teammates: [userOneInDB, userTwoInDB],
      };

      expect(response.body).toEqual(expected);
    });

    it('should fail when the usernames sent dont match a user in db', async () => {
      const workspace = {
        name: 'fourth workpace test',
        owner: userInDB.id,
        teammates: [userInDB],
      };

      // save a workspace to the db
      const workspaceToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await connection
        .getRepository(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = ['theresNoUser', 'noUserExists'];
      const response = await request(app.app)
        .put(`/api/workspaces/${workspaceInDB.id}`)
        .send(teammatesToAdd)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(400);
      const expected = {
        message: 'Username/s not in the db',
        invalidUsernames: teammatesToAdd,
      };

      expect(response.body).toEqual(expected);
    });

    it('should fail when usernames sent are test accounts(stackguest, stacktestuesrtest)', async () => {
      const workspace = {
        name: 'fourth workpace test',
        owner: userInDB.id,
        teammates: [userInDB],
      };

      // save a workspace to the db
      const workspaceToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await connection
        .getRepository(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = ['stackguest', 'stacktestuser'];
      const response = await request(app.app)
        .put(`/api/workspaces/${workspaceInDB.id}`)
        .send(teammatesToAdd)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(403);
      const expected = {
        error: 'Cannot add a testing account',
      };

      expect(response.body).toEqual(expected);
    });

    it('should successfully add teammates when usernames are a combination of invalid and valid users', async () => {
      const workspace = {
        name: 'fifth workpace test',
        owner: userInDB.id,
        teammates: [userInDB],
      };
      const userOne1 = {
        email: 'userOne1@example.com',
        password: 'userOne1',
        username: 'userOne1',
      };
      const userTwo2 = {
        email: 'userTwo2@example.com',
        password: 'userTwo2',
        username: 'userTwo2',
      };

      // need more users in the db
      const userOne1InDB = await connection
        .getRepository<User>(User)
        .create(userOne1)
        .save();
      const userTwo2InDB = await connection
        .getRepository<User>(User)
        .create(userTwo2)
        .save();

      // remove hashPasswords
      delete userOne1InDB.hashPassword;
      delete userTwo2InDB.hashPassword;

      // remove passwords
      delete userOne1InDB.password;
      delete userTwo2InDB.password;

      // change 'createdAt', and 'updatedAt' from to string
      (userOne1InDB as any).createdAt = userOne1InDB.createdAt.toISOString();
      (userOne1InDB as any).updatedAt = userOne1InDB.updatedAt.toISOString();
      (userTwo2InDB as any).createdAt = userTwo2InDB.createdAt.toISOString();
      (userTwo2InDB as any).updatedAt = userTwo2InDB.updatedAt.toISOString();

      // save a workspace to the db
      const workspaceToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);

      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await connection
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = [userOne1.username, userTwo2.username];
      const response = await request(app.app)
        .put(`/api/workspaces/${workspaceInDB.id}`)
        .send(teammatesToAdd)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        message: 'Member/s Added',
        teammates: [userOne1InDB, userTwo2InDB],
      };

      expect(response.body).toEqual(expected);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should fail when request is missing session cookie', async () => {
      const response = await request(app.app)
        .get('/api/workspaces')
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully get a users workspaces when workspaces.length > 0', async () => {
      const workspaceOne = {
        name: 'get workpace one',
        owner: userInDB.id,
        teammates: [userInDB],
      };
      const workspaceTwo = {
        name: 'get workpace two',
        owner: userInDB.id,
        teammates: [userInDB],
      };
      const workspaceOneToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspaceOne as any);
      const workspaceTwoToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspaceTwo as any);
      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceOneInDB: any = await connection
        .getRepository<Workspace>(Workspace)
        .save(workspaceOneToSave);
      const workspaceTwoInDB: any = await connection
        .getRepository<Workspace>(Workspace)
        .save(workspaceTwoToSave);
      const response = await request(app.app)
        .get('/api/workspaces')
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        workspaces: [
          {
            id: workspaceOneInDB.id,
            name: workspaceOneInDB.name,
            ownerId: workspaceOneInDB.owner,
          },
          {
            id: workspaceTwoInDB.id,
            name: workspaceTwoInDB.name,
            ownerId: workspaceTwoInDB.owner,
          },
        ],
      };

      expect(response.body).toEqual(expected);
    });

    it('should successfully return an empty array when workspaces.length === 0', async () => {
      const response = await request(app.app)
        .get('/api/workspaces')
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = { workspaces: [] };

      expect(response.body).toEqual(expected);
    });
  });

  describe('GET /api/workspaces/:workspaceId', () => {
    it('should fail when request is missing session cookie', async () => {
      const response = await request(app.app)
        .get('/api/workspaces/1')
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully get a workspaces teammates when workspaces.teammates > 1', async () => {
      const anotherUser = {
        email: 'useranother@email.com',
        password: 'useranother',
        username: 'user755166',
      };

      const anotherUserInDB = await connection
        .getRepository<User>(User)
        .create(anotherUser)
        .save();

      const workspace = {
        name: 'workspace in get',
        owner: userInDB.id,
        teammates: [userInDB, anotherUserInDB],
      };
      const workspaceToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      const workspaceInDB: any = await connection
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const response = await request(app.app)
        .get(`/api/workspaces/${workspaceInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        message: 'Workspace teammates found',
        teammates: [
          { id: userInDB.id, username: userInDB.username },
          { id: anotherUserInDB.id, username: anotherUserInDB.username },
        ],
      };

      expect(response.body).toEqual(expected);
    });

    it('should successfully get a teammates array with only 1 teammate(the user) when workspaces.teammates === 1', async () => {
      const workspace = {
        name: 'workspace in get',
        owner: userInDB.id,
        teammates: [userInDB],
      };
      const workspaceToSave = connection
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      const workspaceInDB: any = await connection
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const response = await request(app.app)
        .get(`/api/workspaces/${workspaceInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        message: 'Workspace teammates found',
        teammates: [{ id: userInDB.id, username: userInDB.username }],
      };

      expect(response.body).toEqual(expected);
    });
  });
});
