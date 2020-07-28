// eslint-disable-next-line import/no-extraneous-dependencies
import Redis from 'ioredis';
// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { getRepository, Connection } from 'typeorm';

import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  WorkspaceController,
} from '../controllers';
import {
  ChannelService,
  DirectMessageService,
  RedisService,
  UserService,
  WorkspaceService,
} from '../services';
import { Channel, DirectMessage, User, Workspace } from '../entity';
import App from '../App';
import { createTypeormConnection } from '../utils';

describe('DirectMessage Routes', () => {
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
      new DirectMessageController(
        new DirectMessageService(getRepository<DirectMessage>(DirectMessage)),
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
      email: 'direct-message@email.com',
      username: 'directmessageuser',
      password: 'directmessageuser5266',
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
      .getRepository<DirectMessage>(DirectMessage)
      .query('DELETE FROM direct_messages');
  });

  afterAll(async () => {
    await connection
      .getRepository<Channel>(Channel)
      .query('DELETE FROM channels');
    await connection
      .getRepository<Workspace>(Workspace)
      .query('DELETE FROM workspaces');
    await connection.getRepository<User>(User).query('DELETE FROM users');
    await connection.close();
  });

  describe('POST /api/direct-messages', () => {
    it('should successfully create a direct message', async () => {
      const message = {
        content: 'direct message 1 content',
        workspaceId: workspaceInDB.id,
        user: userInDB.id,
      };
      const response = await request(app.app)
        .post('/api/direct-messages')
        .send({ message })
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        success: 'Direct Message Created',
        directMessage: {
          content: message.content,
        },
      };
      const received = {
        success: response.body.success,
        directMessage: {
          content: response.body.directMessage.content,
        },
      };

      expect(received).toStrictEqual(expected);
    });
  });
});
