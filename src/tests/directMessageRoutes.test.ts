// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { DirectMessage, User, Workspace } from '../entity';
import { fakeUser } from './fixtures';
import TestUtils from './utils';
import { createTypeormConnection } from '../utils';

describe('DirectMessage Routes', () => {
  let testUtils: TestUtils;
  // use a single user for all the tests
  let userInDB: User;
  let workspaceInDB: any;
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

    // get the session cookie
    const response = await request(testUtils.getApp())
      .post('/api/auth/login')
      .send(fakeUser.base)
      .set('Accept', 'application/json');

    // eslint-disable-next-line prefer-destructuring
    sessionCookie = response.header['set-cookie'][0];
  });

  afterEach(async () => {
    await testUtils.clearTables('directMessages');
  });

  afterAll(async () => {
    await testUtils.clearTables('users', 'workspaces', 'channels');
  });

  describe('POST /api/direct-messages', () => {
    it('should fail when request is missing session cookie', async () => {
      const message = {
        content: 'direct message 1 content',
        workspaceId: workspaceInDB.id,
        user: userInDB.id,
      };
      const response = await request(testUtils.getApp())
        .post('/api/direct-messages')
        .send({ message })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully create a direct message', async () => {
      const message = {
        content: 'direct message 1 content',
        workspaceId: workspaceInDB.id,
        user: userInDB.id,
      };
      const response = await request(testUtils.getApp())
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

  describe('GET /api/direct-messages?teammateId=teammateId&workspaceId=workspaceId', () => {
    it('should fail when request is missing session cookie', async () => {
      const response = await request(testUtils.getApp())
        .get('/api/direct-messages?teammateId=1&workspaceId=1')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully return an array of direct messages when directMessages.length > 0', async () => {
      const otherUser = {
        email: 'direct-messageuser@email.com',
        username: 'ajgkajkgdirectmessageuser',
        password: 'directmjijagessageuser5266',
      };

      const otherUserInDB = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(otherUser)
        .save();
      let message: any = {
        content: 'GET direct direct message 1 content',
        workspaceId: workspaceInDB.id,
        user: userInDB.id,
      };
      let message2: any = {
        content: 'GET direct direct message 2 content',
        workspaceId: workspaceInDB.id,
        user: otherUserInDB.id,
      };
      message = testUtils
        .getConnection()
        .getRepository<DirectMessage>(DirectMessage)
        .create(message as any);
      message = await testUtils
        .getConnection()
        .getRepository<DirectMessage>(DirectMessage)
        .save(message);

      message2 = testUtils
        .getConnection()
        .getRepository<DirectMessage>(DirectMessage)
        .create(message2 as any);
      message2 = await testUtils
        .getConnection()
        .getRepository<DirectMessage>(DirectMessage)
        .save(message2);

      const [
        messageInDB,
        message2InDB,
      ] = testUtils.setupEntitiesForComparison('messages', [message, message2]);

      (messageInDB as any).user = { username: userInDB.username };
      (message2InDB as any).user = { username: otherUserInDB.username };

      const response = await request(testUtils.getApp())
        .get(
          `/api/direct-messages?teammateId=${otherUserInDB.id}&workspaceId=${workspaceInDB.id}`
        )
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        directMessages: [messageInDB, message2InDB],
      };

      expect(response.body).toEqual(expected);
    });

    it('should successfully return an empty array when messages.length === 0', async () => {
      const response = await request(testUtils.getApp())
        .get(
          `/api/direct-messages?teammateId=${userInDB.id}&workspaceId=${workspaceInDB.id}`
        )
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        directMessages: [],
      };

      expect(response.body).toEqual(expected);
    });
  });
});
