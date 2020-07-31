// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';

import { Channel, Message, User, Workspace } from '../entity';
import { fakeUser } from './fixtures';
import TestUtils from './utils';
import { createTypeormConnection } from '../utils';

describe('Message Routes', () => {
  let testUtils: TestUtils;
  // use a single user for all the tests
  let userInDB: User;
  let workspaceInDB: any;
  let channelInDB: any;
  // keep track of the session cookie
  let sessionCookie: string;

  beforeAll(async () => {
    testUtils = new TestUtils(await createTypeormConnection());

    userInDB = await testUtils
      .getConnection()
      .getRepository<User>(User)
      .create(fakeUser.base)
      .save();

    testUtils.setupEntitiesForComparison('users', [userInDB]);

    const workspace = {
      name: 'channel workspace',
      owner: userInDB.id,
    };

    const workspaceToSave = testUtils
      .getConnection()
      .getRepository<Workspace>(Workspace)
      .create(workspace as any);

    workspaceInDB = await testUtils
      .getConnection()
      .getRepository<Workspace>(Workspace)
      .save(workspaceToSave);

    const channel = {
      description: 'message channel description',
      name: 'message channel name',
      members: [userInDB.username],
      private: false,
      workspace: workspaceInDB.id,
    };

    const channelToSave = testUtils
      .getConnection()
      .getRepository<Channel>(Channel)
      .create(channel as any);

    channelInDB = await testUtils
      .getConnection()
      .getRepository<Channel>(Channel)
      .save(channelToSave);

    // get the session cookie
    const response = await request(testUtils.getApp())
      .post('/api/auth/login')
      .send(fakeUser.base)
      .set('Accept', 'application/json');

    // eslint-disable-next-line prefer-destructuring
    sessionCookie = response.header['set-cookie'][0];
  });

  afterEach(async () => {
    await testUtils.clearTables('messages');
  });

  afterAll(async () => {
    await testUtils.clearTables('users', 'workspaces', 'channels');
    await testUtils.closeConnection();
  });

  describe('POST /api/messages', () => {
    it('should fail when request is missing session cookie', async () => {
      const message = {
        channel: channelInDB.id,
        content: 'message 1 content',
        user: userInDB.id,
      };
      const response = await request(testUtils.getApp())
        .post('/api/messages')
        .send({ message })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully create a message', async () => {
      const message = {
        channel: channelInDB.id,
        content: 'message 1 content',
        user: userInDB.id,
      };
      const response = await request(testUtils.getApp())
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

  describe('GET /api/messages?channelId=channelId', () => {
    it('should fail when request is missing session cookie', async () => {
      const response = await request(testUtils.getApp())
        .get(`/api/messages?channelId=${channelInDB.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully return an array of messages when messages.length > 0', async () => {
      let message: any = {
        channel: channelInDB.id,
        content: 'GET message 1 content',
        user: userInDB.id,
      };
      let message2: any = {
        channel: channelInDB.id,
        content: 'GET message 2 content',
        user: userInDB.id,
      };

      message = testUtils
        .getConnection()
        .getRepository<Message>(Message)
        .create(message as any);
      message = await testUtils
        .getConnection()
        .getRepository<Message>(Message)
        .save(message);

      message2 = testUtils
        .getConnection()
        .getRepository<Message>(Message)
        .create(message2 as any);
      message2 = await testUtils
        .getConnection()
        .getRepository<Message>(Message)
        .save(message2);

      const [
        messageInDB,
        message2InDB,
      ] = testUtils.setupEntitiesForComparison('messages', [message, message2]);

      (messageInDB as any).user = { username: userInDB.username };
      (message2InDB as any).user = { username: userInDB.username };

      channelInDB.messages = [messageInDB, message2InDB];

      await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channelInDB);

      const response = await request(testUtils.getApp())
        .get(`/api/messages?channelId=${channelInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        messages: channelInDB.messages,
      };

      expect(response.body).toEqual(expected);
    });

    it('should successfully return an empty array when messages.length === 0', async () => {
      channelInDB.messages = [];

      await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channelInDB);

      const response = await request(testUtils.getApp())
        .get(`/api/messages?channelId=${channelInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        messages: [],
      };

      expect(response.body).toEqual(expected);
    });
  });
});
