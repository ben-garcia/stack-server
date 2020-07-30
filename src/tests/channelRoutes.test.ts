// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';

import { Channel, User, Workspace } from '../entity';
import { fakeUser } from './fixtures';
import TestUtils from './utils';
import { createTypeormConnection } from '../utils';

describe('Channel Routes', () => {
  let testUtils: TestUtils;
  // use a single user for all the tests
  let userInDB: User;
  let workspaceInDB: any;
  // keep track of the session cookie
  let sessionCookie: string;

  beforeAll(async () => {
    testUtils = new TestUtils(await createTypeormConnection());

    const user = await testUtils
      .getConnection()
      .getRepository<User>(User)
      .create(fakeUser.base)
      .save();
    const [userInDBCopy] = testUtils.setupEntitiesForComparison('users', [
      user,
    ]);

    userInDB = userInDBCopy as User;

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
    await testUtils.clearTables('channels');
  });

  afterAll(async () => {
    await testUtils.clearTables('users', 'workspaces');
    await testUtils.closeConnection();
  });

  describe('POST /api/channels', () => {
    it('should fail when request is missing session cookie', async () => {
      const channel = {
        description: 'first channel description',
        name: 'first channel test',
        members: ['test'],
        private: false,
        workspace: workspaceInDB.id,
      };
      const response = await request(testUtils.getApp())
        .post('/api/channels')
        .send({ channel })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully create a channel with members > 1 and private === false', async () => {
      const user = {
        email: 'channel user',
        password: 'channelUser',
        username: 'channelUser5216',
      };
      const channelUser: User = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(user)
        .save();
      const [channelUserInDB] = testUtils.setupEntitiesForComparison('users', [
        channelUser,
      ]);
      const channel = {
        description: 'first channel description',
        name: 'first channel test',
        members: [userInDB.username, (channelUserInDB as User).username],
        private: false,
        workspace: workspaceInDB.id,
      };
      const res = await request(testUtils.getApp())
        .post('/api/channels')
        .send({ channel })
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: 'Channel Created',
        channel: {
          description: channel.description,
          members: [userInDB, channelUserInDB],
          name: channel.name,
          private: false,
          topic: '',
        },
      };
      const [
        receivedChannel,
      ] = testUtils.setupEntitiesForComparison('channels:dates', [
        res.body.channel,
      ]);
      const response = { ...res.body, channel: receivedChannel };

      expect(response).toEqual(expected);
    });

    it('should successfully create a channel with members > 1 and private === false and with an invalid username', async () => {
      const user = {
        email: 'emailakgjakgj@jgjg.com',
        password: 'ugugugugu',
        username: 'oa02h0t2h',
      };

      const channelUser: User = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(user)
        .save();

      const [channelUserInDB] = testUtils.setupEntitiesForComparison('users', [
        channelUser,
      ]);

      const channel = {
        description: 'first channel description',
        name: 'first channel test',
        members: [
          userInDB.username,
          (channelUserInDB as User).username,
          'fakeuser',
        ],
        private: false,
        workspace: userInDB.id,
      };
      const res = await request(testUtils.getApp())
        .post('/api/channels')
        .send({ channel })
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: 'Channel Created',
        channel: {
          description: channel.description,
          members: [userInDB, channelUserInDB],
          name: channel.name,
          private: false,
          topic: '',
        },
      };
      const [
        receivedChannel,
      ] = testUtils.setupEntitiesForComparison('channels:dates', [
        res.body.channel,
      ]);
      const response = { ...res.body, channel: receivedChannel };

      expect(response).toEqual(expected);
    });

    it('should successfully create a channel with members === 1 and private === true', async () => {
      const user = {
        email: 'channel user 2',
        password: 'channelUser6262621',
        username: 'user26267',
      };
      const channelUser: User = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(user)
        .save();

      testUtils.setupEntitiesForComparison('users', [channelUser]);

      const channel = {
        description: 'second channel description',
        name: 'second channel test',
        members: [userInDB.username],
        private: true,
        workspace: userInDB.id,
      };
      const res = await request(testUtils.getApp())
        .post('/api/channels')
        .send({ channel })
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      const expected = {
        message: 'Channel Created',
        channel: {
          description: channel.description,
          members: [userInDB],
          name: channel.name,
          private: true,
          topic: '',
        },
      };
      const [
        receivedChannel,
      ] = testUtils.setupEntitiesForComparison('channels:dates', [
        res.body.channel,
      ]);
      const response = { ...res.body, channel: receivedChannel };

      expect(response).toEqual(expected);
    });
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
      const channelToSave = testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .create(channel as any);

      channelInDB = await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channelToSave);
    });

    it('should fail when request is missing session cookie', async () => {
      const body = {
        members: [userInDB.username],
      };
      const response = await request(testUtils.getApp())
        .put(`/api/channels/${channelInDB.id}`)
        .send(body)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully update channel.members when req.body.members > 0', async () => {
      const body = {
        members: [userInDB.username],
      };
      const response = await request(testUtils.getApp())
        .put(`/api/channels/${channelInDB.id}`)
        .send(body)
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
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
      const response = await request(testUtils.getApp())
        .put(`/api/channels/${channelInDB.id}`)
        .send(body)
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
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
      const response = await request(testUtils.getApp())
        .put(`/api/channels/${channelInDB.id}`)
        .send(body)
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
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
      const response = await request(testUtils.getApp())
        .put(`/api/channels/${channelInDB.id}`)
        .send(body)
        .set('Cookie', sessionCookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
      const expected = {
        message: 'Something went wrong',
      };

      expect(response.body).toStrictEqual(expected);
    });
  });

  describe('GET /api/channels/channelId', () => {
    it('should fail when request is missing session cookie', async () => {
      const response = await request(testUtils.getApp())
        .get('/api/channels/1')
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should return an array of members when members.length > 1', async () => {
      const otherUser = {
        username: 'bestuserna',
        password: 'password15156',
        email: 'test@test.com',
      };
      const otherUserInDB = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(otherUser)
        .save();
      const channel = {
        name: 'name for channel',
        description: 'description for channel',
        private: false,
        workspace: workspaceInDB.id,
        members: [userInDB, otherUserInDB],
      };
      const channelToSave = testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .create(channel);
      const channelInDB: any = await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channelToSave);
      const response = await request(testUtils.getApp())
        .get(`/api/channels/${channelInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        members: [
          { id: userInDB.id, username: userInDB.username },
          { id: otherUserInDB.id, username: otherUserInDB.username },
        ],
      };

      expect(response.body).toEqual(expected);
    });

    it('should return array of members with ONLY the user who created it when members.length === 1', async () => {
      const channel = {
        name: 'name for channel',
        description: 'description for channel',
        private: false,
        workspace: workspaceInDB.id,
        members: [userInDB],
      };
      const channelToSave = testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .create(channel);
      const channelInDB: any = await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channelToSave);
      const response = await request(testUtils.getApp())
        .get(`/api/channels/${channelInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        members: [{ id: userInDB.id, username: userInDB.username }],
      };

      expect(response.body).toEqual(expected);
    });
  });

  describe('GET /api/channels?workspace=workspaceId', () => {
    it('should fail when request is missing session cookie', async () => {
      const response = await request(testUtils.getApp())
        .get(`/api/channels?workspaceId=${workspaceInDB.id}`)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(401);

      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should return an array of channels when channels.length > 0', async () => {
      const channel1 = {
        name: 'name for channel',
        description: 'description for channel',
        private: false,
        members: [userInDB],
        workspace: workspaceInDB.id,
      };
      const channel1ToSave = testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .create(channel1);
      const channel1InDB: any = await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channel1ToSave);
      const channel2 = {
        name: 'other for channel',
        description: 'jga0ga0jg for channel',
        private: false,
        members: [userInDB],
        workspace: workspaceInDB.id,
      };
      const channel2ToSave = testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .create(channel2);
      const channel2InDB: any = await testUtils
        .getConnection()
        .getRepository<Channel>(Channel)
        .save(channel2ToSave);

      workspaceInDB.channels = [channel1InDB, channel2InDB];

      await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceInDB);

      const response = await request(testUtils.getApp())
        .get(`/api/channels?workspaceId=${workspaceInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const [
        channelOne,
        channelTwo,
      ] = testUtils.setupEntitiesForComparison('channels:members', [
        channel1InDB,
        channel2InDB,
      ]);

      const expected = {
        channels: [
          {
            ...channelOne,
            user: userInDB.id,
          },
          {
            ...channelTwo,
            user: userInDB.id,
          },
        ],
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should return an empty array of channels when channels.length === 0', async () => {
      workspaceInDB.channels = [];

      await testUtils
        .getConnection()
        .getRepository<Workspace>(Workspace)
        .save(workspaceInDB);

      const response = await request(testUtils.getApp())
        .get(`/api/channels?workspaceId=${workspaceInDB.id}`)
        .set('Cookie', sessionCookie)
        .set('Accept', 'applicatiion/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const expected = {
        channels: [],
      };

      expect(response.body).toStrictEqual(expected);
    });
  });
});
