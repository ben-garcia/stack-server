// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { User, Workspace } from '../entity';
import { fakeUser } from './fixtures';
import TestUtils from './utils';
import { createTypeormConnection } from '../utils';

describe('Workspace Routes', () => {
  let testUtils: TestUtils;
  // use a single user for all the tests
  let userInDB: User;
  // keep track of the session cookie
  let sessionCookie: string;

  beforeAll(async () => {
    testUtils = new TestUtils(await createTypeormConnection());

    userInDB = await testUtils
      .getConnection()
      .getRepository<User>(User)
      .create(fakeUser.base)
      .save();

    const response = await request(testUtils.getApp())
      .post('/api/auth/login')
      .send(fakeUser.base)
      .set('Accept', 'application/json');

    // eslint-disable-next-line prefer-destructuring
    sessionCookie = response.header['set-cookie'][0];
  });

  afterEach(async () => {
    await testUtils.clearTables('workspaces');
  });

  afterAll(async () => {
    await testUtils.clearTables('users', 'workspaces');
  });

  describe('POST /api/workspaces', () => {
    it('should fail when request is missing session cookie', async () => {
      const workspace = {
        name: 'first workpace test',
        owner: userInDB.id,
      };
      const response = await request(testUtils.getApp())
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
      const response = await request(testUtils.getApp())
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
      const response = await request(testUtils.getApp())
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
      const response = await request(testUtils.getApp())
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
      let userOne = {
        email: 'useruseusur@email.com',
        password: 'iajgiajg',
        username: 'ojagah45j3j5',
      };
      let userTwo = {
        email: 'akgjagjai@email.com',
        password: 'userTgjiajgiajwo',
        username: 'userTajgiaiiijgijwo',
      };
      // need more users in the db
      userOne = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(userOne)
        .save();
      userTwo = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(userTwo)
        .save();

      const [
        userOneInDB,
        userTwoInDB,
      ] = testUtils.setupEntitiesForComparison('users', [
        userOne as User,
        userTwo as User,
      ]);

      // save a workspace to the db
      const workspaceToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);

      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = [userOne.username, userTwo.username];
      const response = await request(testUtils.getApp())
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
      const workspaceToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await testUtils
        .getConnection()
        .getRepository(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = ['theresNoUser', 'noUserExists'];
      const response = await request(testUtils.getApp())
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
      const workspaceToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await testUtils
        .getConnection()
        .getRepository(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = ['stackguest', 'stacktestuser'];
      const response = await request(testUtils.getApp())
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
      let userOne1 = {
        email: 'userOne1@example.com',
        password: 'userOne1',
        username: 'userOne1',
      };
      let userTwo2 = {
        email: 'userTwo2@example.com',
        password: 'userTwo2',
        username: 'userTwo2',
      };

      // need more users in the db
      userOne1 = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(userOne1)
        .save();
      userTwo2 = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(userTwo2)
        .save();

      // format the user objects as the objects returned from the server
      const [
        userOne1InDB,
        userTwo2InDB,
      ] = testUtils.setupEntitiesForComparison('users', [
        userOne1 as User,
        userTwo2 as User,
      ]);

      // save a workspace to the db
      const workspaceToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);

      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceInDB: any = await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const teammatesToAdd = [userOne1.username, userTwo2.username];
      const response = await request(testUtils.getApp())
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
      const response = await request(testUtils.getApp())
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
      const workspaceOneToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspaceOne as any);
      const workspaceTwoToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspaceTwo as any);
      // ts yelling at me when trying to chain save after create
      // not sure why
      const workspaceOneInDB: any = await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceOneToSave);
      const workspaceTwoInDB: any = await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceTwoToSave);
      const response = await request(testUtils.getApp())
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
      testUtils.clearTables('workspaces');
      const response = await request(testUtils.getApp())
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
      const response = await request(testUtils.getApp())
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

      const anotherUserInDB = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(anotherUser)
        .save();

      const workspace = {
        name: 'workspace in get',
        owner: userInDB.id,
        teammates: [userInDB, anotherUserInDB],
      };
      const workspaceToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      const workspaceInDB: any = await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const response = await request(testUtils.getApp())
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
      const workspaceToSave = testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .create(workspace as any);
      const workspaceInDB: any = await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceToSave);
      const response = await request(testUtils.getApp())
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
