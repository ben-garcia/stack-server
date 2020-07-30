// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';

import { User } from '../entity';
import { fakeUser } from './fixtures';
import TestUtils from './utils';
import { createTypeormConnection } from '../utils';

describe('Authentication Routes', () => {
  let testUtils: TestUtils;

  beforeAll(async () => {
    testUtils = new TestUtils(await createTypeormConnection());
  });

  afterEach(async () => {
    testUtils.clearTables('users');
  });

  afterAll(async () => {
    testUtils.closeConnection();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully create a user', async () => {
      const expected = { message: 'User Created' };
      const response = await request(testUtils.getApp())
        .post('/api/auth/register')
        .send(fakeUser.base)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(expected);
    });

    describe('email', () => {
      it('should fail when trying to create a user with an invalid email', async () => {
        const expected = { error: '"email" must be a valid email' };
        const response = await request(testUtils.getApp())
          .post('/api/auth/register')
          .send(fakeUser.withInvalidEmail)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toEqual(expected);
      });

      it('should fail when trying to create a user when a user already exists with same email', async () => {
        const expected = { error: ['User with that email already exists'] };

        await testUtils
          .getConnection()
          .getRepository<User>(User)
          .create(fakeUser.base)
          .save();

        const response = await request(testUtils.getApp())
          .post('/api/auth/register')
          .send(fakeUser.withSameEmail)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(409);

        expect(response.body).toEqual(expected);
      });
    });

    describe('username', () => {
      it('should fail when trying to create a user with a username that doesnt meet the length requirement', async () => {
        const expected = {
          error: '"username" length must be at least 6 characters long',
        };
        const response = await request(testUtils.getApp())
          .post('/api/auth/register')
          .send(fakeUser.withInvalidUsername)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toEqual(expected);
      });

      it('should fail when trying to create a user when a user already exists with same username', async () => {
        const expected = { error: ['User with that username already exists'] };

        await testUtils
          .getConnection()
          .getRepository<User>(User)
          .create(fakeUser.base)
          .save();

        const response = await request(testUtils.getApp())
          .post('/api/auth/register')
          .send(fakeUser.withSameUsername)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(409);

        expect(response.body).toEqual(expected);
      });
    });

    it('should fail when trying to create a user when a user already exists with same email and username', async () => {
      const expected = {
        error: [
          'User with that email already exists',
          'User with that username already exists',
        ],
      };

      await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(fakeUser.base)
        .save();

      const response = await request(testUtils.getApp())
        .post('/api/auth/register')
        .send(fakeUser.base)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toEqual(expected);
    });

    it('should fail when trying to create a user with a password that doesnt meet the legnth requirement', async () => {
      const expected = {
        error: `"password" with value "${fakeUser.withInvalidPassword.password}" fails to match the required pattern: /^[a-zA-Z0-9]{6,50}$/`,
      };

      const response = await request(testUtils.getApp())
        .post('/api/auth/register')
        .send(fakeUser.withInvalidPassword)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual(expected);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login', async () => {
      const userInDB = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(fakeUser.base)
        .save();

      // remove hashPassword method and password property
      delete userInDB.hashPassword;
      delete userInDB.password;

      const response = await request(testUtils.getApp())
        .post('/api/auth/login')
        .send(fakeUser.base)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const [cookie] = response.header['set-cookie'];
      // User entity's createdAt and updatedAt properties are of type Date
      // call toISOString to get convert them to a string to compare
      const expected = {
        user: {
          ...userInDB,
          createdAt: userInDB.createdAt.toISOString(),
          updatedAt: userInDB.updatedAt.toISOString(),
        },
      };

      expect(response.body).toStrictEqual(expected);
      expect(cookie).toMatch(/^stackSessionId/);
    });

    it('should fail when there is no user in the db with a particallar email login', async () => {
      await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(fakeUser.base)
        .save();

      const response = await request(testUtils.getApp())
        .post('/api/auth/login')
        .send(fakeUser.tryingToLoginWithInvalidEmail)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404);
      const expected = {
        error: 'There is no user with that email/password combination',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should fail when password dont match', async () => {
      await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(fakeUser.base)
        .save();

      const response = await request(testUtils.getApp())
        .post('/api/auth/login')
        .send(fakeUser.tryingToLoginWithInvalidPassword)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404);

      const expectResponse = {
        error: 'There is no user with that email/password combination',
      };

      expect(response.body).toStrictEqual(expectResponse);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should fail when session cookie is missing', async () => {
      const response = await request(testUtils.getApp())
        .post('/api/auth/logout')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      const expected = {
        error: 'Unauthorized',
      };

      expect(response.body).toStrictEqual(expected);
    });

    it('should successfully logout', async () => {
      const userInDB = await testUtils
        .getConnection()
        .getRepository<User>(User)
        .create(fakeUser.base)
        .save();
      const loginResponse = await request(testUtils.getApp())
        .post('/api/auth/login')
        .send(fakeUser.base)
        .set('Accept', 'application/json');
      const logoutResponse = await request(testUtils.getApp())
        .post('/api/auth/logout')
        .set('Cookie', loginResponse.header['set-cookie'])
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
      const expected = {
        message: `${userInDB.username} logged out successfully`,
      };
      expect(logoutResponse.body).toStrictEqual(expected);
    });
  });
});
