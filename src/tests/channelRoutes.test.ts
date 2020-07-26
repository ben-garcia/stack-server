// eslint-disable-next-line import/no-extraneous-dependencies
import Redis from 'ioredis';
// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { getRepository, Connection } from 'typeorm';

import {
  AuthenticationController,
  ChannelController,
  WorkspaceController,
} from '../controllers';
import {
  ChannelService,
  RedisService,
  UserService,
  WorkspaceService,
} from '../services';
import { Channel, User, Workspace } from '../entity';
import App from '../App';
import { createTypeormConnection } from '../utils';

describe('Channel Routes', () => {
  let app: App;
  let connection: Connection;
  // use a single user for all the tests
  let userInDB: User;
  let workspaceInDB: any;
  // keep track of the session cookie
  let sessionCookie: string;

  beforeAll(async () => {
    connection = await createTypeormConnection();
    app = new App([
      new AuthenticationController(new UserService(getRepository<User>(User))),
      new ChannelController(
        new ChannelService(getRepository<Channel>(Channel)),
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User)),
        new WorkspaceService(getRepository<Workspace>(Workspace))
      ),
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

    delete userInDB.hashPassword;
    delete userInDB.password;

    const workspace = {
      name: 'channel workspace',
      owner: userInDB.id,
    };

    const workspaceToSave = connection
      .getRepository<Workspace>(Workspace)
      .create(workspace as any);

    workspaceInDB = await connection
      .getRepository<Workspace>(Workspace)
      .save(workspaceToSave);

    const response = await request(app.app)
      .post('/api/auth/login')
      .send(user)
      .set('Accept', 'application/json');

    // eslint-disable-next-line prefer-destructuring
    sessionCookie = response.header['set-cookie'][0];
  });

  afterEach(async () => {
    await connection
      .getRepository<Channel>(Channel)
      .query('DELETE FROM channels');
  });

  afterAll(async () => {
    await connection.getRepository<User>(User).query('DELETE FROM users');
    await connection.getRepository<User>(User).query('DELETE FROM workspaces');
    await connection.close();
  });

  describe('POST /api/channels', () => {
    it('should successfully create a channel with members > 1 and private === false', async () => {
      const user = {
        email: 'channel user',
        password: 'channelUser',
        username: 'channelUser5216',
      };

      const channelUser2InDB: User = await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      delete channelUser2InDB.hashPassword;
      delete channelUser2InDB.password;

      const channel = {
        description: 'first channel description',
        name: 'first channel test',
        members: [userInDB.username, channelUser2InDB.username],
        private: false,
        workspace: workspaceInDB.id,
      };
      const response = await request(app.app)
        .post('/api/channels')
        .send({ channel })
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: 'Channel Created',
        channel: {
          description: channel.description,
          members: [
            {
              ...userInDB,
              createdAt: userInDB.createdAt.toISOString(),
              updatedAt: userInDB.updatedAt.toISOString(),
            },
            {
              ...channelUser2InDB,
              createdAt: channelUser2InDB.createdAt.toISOString(),
              updatedAt: channelUser2InDB.updatedAt.toISOString(),
            },
          ],
          name: channel.name,
          private: false,
          topic: '',
        },
      };

      delete response.body.channel.id;
      delete response.body.channel.createdAt;
      delete response.body.channel.updatedAt;

      expect(response.body).toEqual(expected);
    });

    it('should successfully create a channel with members > 1 and private === false and with an invalid username', async () => {
      const user = {
        email: 'emailakgjakgj@jgjg.com',
        password: 'ugugugugu',
        username: 'oa02h0t2h',
      };

      const channelUser2InDB: User = await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      delete channelUser2InDB.hashPassword;
      delete channelUser2InDB.password;

      const channel = {
        description: 'first channel description',
        name: 'first channel test',
        members: [userInDB.username, channelUser2InDB.username, 'fakeuser'],
        private: false,
        workspace: userInDB.id,
      };
      const response = await request(app.app)
        .post('/api/channels')
        .send({ channel })
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: 'Channel Created',
        channel: {
          description: channel.description,
          members: [
            {
              ...userInDB,
              createdAt: userInDB.createdAt.toISOString(),
              updatedAt: userInDB.updatedAt.toISOString(),
            },
            {
              ...channelUser2InDB,
              createdAt: channelUser2InDB.createdAt.toISOString(),
              updatedAt: channelUser2InDB.updatedAt.toISOString(),
            },
          ],
          name: channel.name,
          private: false,
          topic: '',
        },
      };

      delete response.body.channel.id;
      delete response.body.channel.createdAt;
      delete response.body.channel.updatedAt;

      expect(response.body).toEqual(expected);
    });

    it('should successfully create a channel with members === 1 and private === true', async () => {
      const user = {
        email: 'channel user 2',
        password: 'channelUser6262621',
        username: 'user26267',
      };

      const channelUser2InDB: User = await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      delete channelUser2InDB.hashPassword;
      delete channelUser2InDB.password;

      const channel = {
        description: 'second channel description',
        name: 'second channel test',
        members: [userInDB.username],
        private: true,
        workspace: userInDB.id,
      };
      const response = await request(app.app)
        .post('/api/channels')
        .send({ channel })
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: 'Channel Created',
        channel: {
          description: channel.description,
          members: [
            {
              ...userInDB,
              createdAt: userInDB.createdAt.toISOString(),
              updatedAt: userInDB.updatedAt.toISOString(),
            },
          ],
          name: channel.name,
          private: true,
          topic: '',
        },
      };

      delete response.body.channel.id;
      delete response.body.channel.createdAt;
      delete response.body.channel.updatedAt;

      expect(response.body).toEqual(expected);
    });

    describe('PUT /api/channels/:channelId', () => {
      let channelInDB: any;

      beforeEach(async () => {
        const channel = {
          description: 'second channel description',
          name: 'second channel test',
          members: [userInDB.username],
          private: false,
          workspace: workspaceInDB.id,
        };
        const channelToSave = connection
          .getRepository<Channel>(Channel)
          .create(channel as any);

        channelInDB = await connection
          .getRepository<Channel>(Channel)
          .save(channelToSave);
      });

      it('should successfully update channel.members when req.body.members > 0', async () => {
        const body = {
          members: [userInDB.username],
        };
        const response = await request(app.app)
          .put(`/api/channels/${channelInDB.id}`)
          .send(body)
          .set('Cookie', sessionCookie)
          .set('Accept', 'applicatiion/json')
          .expect('Content-Type', /json/)
          .expect(200);
        const expected = {
          message: 'Channel members have been updated',
        };

        expect(response.body).toStrictEqual(expected);
      });

      it('should successfully update channel.topic', async () => {
        const body = {
          topic: 'new topic',
        };
        const response = await request(app.app)
          .put(`/api/channels/${channelInDB.id}`)
          .send(body)
          .set('Cookie', sessionCookie)
          .set('Accept', 'applicatiion/json')
          .expect('Content-Type', /json/)
          .expect(200);
        const expected = {
          message: 'Channel description/topic changed',
        };

        expect(response.body).toStrictEqual(expected);
      });

      it('should successfully update channel.description', async () => {
        const body = {
          description: 'new description',
        };
        const response = await request(app.app)
          .put(`/api/channels/${channelInDB.id}`)
          .send(body)
          .set('Cookie', sessionCookie)
          .set('Accept', 'applicatiion/json')
          .expect('Content-Type', /json/)
          .expect(200);
        const expected = {
          message: 'Channel description/topic changed',
        };

        expect(response.body).toStrictEqual(expected);
      });

      it('should fail when sending topic and description in req.body', async () => {
        const body = {
          members: ['testtest', 'testantohertest'],
          description: 'new description',
          topic: 'best topic',
        };
        const response = await request(app.app)
          .put(`/api/channels/${channelInDB.id}`)
          .send(body)
          .set('Cookie', sessionCookie)
          .set('Accept', 'applicatiion/json')
          .expect('Content-Type', /json/)
          .expect(400);
        const expected = {
          message: 'Something went wrong',
        };

        expect(response.body).toStrictEqual(expected);
      });
    });
  });
});
