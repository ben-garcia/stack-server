// eslint-disable-next-line import/no-extraneous-dependencies
import Redis from 'ioredis';
// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { getRepository, Connection } from 'typeorm';

import {
  AuthenticationController,
  ChannelController,
  MessageController,
  WorkspaceController,
} from '../controllers';
import {
  ChannelService,
  MessageService,
  RedisService,
  UserService,
  WorkspaceService,
} from '../services';
import { Channel, Message, User, Workspace } from '../entity';
import App from '../App';
import { createTypeormConnection } from '../utils';

describe('Message Routes', () => {
  let app: App;
  let connection: Connection;
  // use a single user for all the tests
  let userInDB: User;
  let workspaceInDB: any;
  let channelInDB: any;
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
      new MessageController(
        new ChannelService(getRepository<Channel>(Channel)),
        new MessageService(getRepository<Message>(Message)),
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User))
      ),
      new WorkspaceController(
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User)),
        new WorkspaceService(getRepository<Workspace>(Workspace))
      ),
    ]);

    const user = {
      email: 'message@email.com',
      username: 'messageuser',
      password: 'messageuser5266',
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

    const channel = {
      description: 'message channel description',
      name: 'message channel name',
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

    // get the session cookie
    const response = await request(app.app)
      .post('/api/auth/login')
      .send(user)
      .set('Accept', 'application/json');

    // eslint-disable-next-line prefer-destructuring
    sessionCookie = response.header['set-cookie'][0];
  });

  afterEach(async () => {
    await connection
      .getRepository<Message>(Message)
      .query('DELETE FROM messages');
  });

  afterAll(async () => {
    await connection
      .getRepository<Channel>(Channel)
      .query('DELETE FROM chnanels');
    await connection
      .getRepository<Workspace>(Workspace)
      .query('DELETE FROM workspaces');
    await connection.getRepository<User>(User).query('DELETE FROM users');
    await connection.close();
  });

  describe('POST /api/messages', () => {
    it('should successfully create a message', async () => {
      const message = {
        channel: channelInDB.id,
        content: 'message 1 content',
        user: userInDB.id,
      };
      const response = await request(app.app)
        .post('/api/messages')
        .send({ message })
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        success: 'Message Created',
        message: {
          content: message.content,
        },
      };
      const received = {
        success: response.body.success,
        message: {
          content: response.body.message.content,
        },
      };

      expect(received).toStrictEqual(expected);
    });
  });
});
