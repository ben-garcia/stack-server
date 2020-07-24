// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { getRepository, Connection } from 'typeorm';

import { AuthenticationController } from '../controllers';
import { UserService } from '../services';
import { User } from '../entity';
import App from '../App';
import { createTypeormConnection } from '../utils';

describe('Authentication Routes', () => {
  let app: App;
  let connection: Connection;

  beforeAll(async () => {
    connection = await createTypeormConnection();
    app = new App([
      new AuthenticationController(new UserService(getRepository<User>(User))),
    ]);
  });

  afterEach(async () => {
    await connection.getRepository<User>(User).query('DELETE FROM users');
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully create a user', async () => {
      const user = {
        email: 'testemail@email.com',
        username: 'testuser',
        password: 'bestpassword',
      };
      const expected = { message: 'User Created' };

      const response = await request(app.app)
        .post('/api/auth/register')
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(expected);
    });

    describe('email', () => {
      it('should fail when trying to create a user with an invalid email', async () => {
        const user = {
          email: 'invalidemail',
          username: 'testuser',
          password: 'bestpassword',
        };
        const expected = { error: '"email" must be a valid email' };

        const response = await request(app.app)
          .post('/api/auth/register')
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toEqual(expected);
      });

      it('should fail when trying to create a user when a user already exists with same email', async () => {
        const user = {
          email: 'validemail@email.com',
          username: 'anotheruser',
          password: 'bestpassword',
        };
        const expected = { error: ['User with that email already exists'] };

        await connection
          .getRepository<User>(User)
          .create({
            ...user,
            username: 'usertest',
          })
          .save();

        const response = await request(app.app)
          .post('/api/auth/register')
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(409);

        expect(response.body).toEqual(expected);
      });
    });

    describe('username', () => {
      it('should fail when trying to create a user with a username that doesnt meet the length requirement', async () => {
        const user = {
          email: 'correctemail@email.com',
          username: 'user',
          password: 'bestpassword',
        };
        const expected = {
          error: '"username" length must be at least 6 characters long',
        };

        const response = await request(app.app)
          .post('/api/auth/register')
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toEqual(expected);
      });

      it('should fail when trying to create a user when a user already exists with same username', async () => {
        const user = {
          email: 'bestemail@thereis.com',
          username: 'secretusername',
          password: 'whatisthepassword',
        };
        const expected = { error: ['User with that username already exists'] };

        await connection
          .getRepository<User>(User)
          .create({ ...user, email: 'nottheright@email.com' })
          .save();

        const response = await request(app.app)
          .post('/api/auth/register')
          .send(user)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(409);

        expect(response.body).toEqual(expected);
      });
    });

    it('should fail when trying to create a user when a user already exists with same email and username', async () => {
      const user = {
        email: 'exampleemail@test.com',
        username: 'user91050',
        password: 'topsecret',
      };
      const expected = {
        error: [
          'User with that email already exists',
          'User with that username already exists',
        ],
      };

      await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      const response = await request(app.app)
        .post('/api/auth/register')
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toEqual(expected);
    });

    it('should fail when trying to create a user with a password that doesnt meet the legnth requirement', async () => {
      const user = {
        email: 'correctemail@email.com',
        username: 'correctuser',
        password: '12345',
      };
      const expected = {
        error: `"password" with value "${user.password}" fails to match the required pattern: /^[a-zA-Z0-9]{6,50}$/`,
      };

      const response = await request(app.app)
        .post('/api/auth/register')
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual(expected);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login', async () => {
      const user = {
        email: 'testemail@email.com',
        username: 'testuser',
        password: 'bestpassword',
      };

      const userInDB = await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      // remove hashPassword method and password property
      delete userInDB.hashPassword;
      delete userInDB.password;

      const response = await request(app.app)
        .post('/api/auth/login')
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      const [cookie] = response.header['set-cookie'];
      // User entity's createdAt and updatedAt properties are of type Date
      // call toISOString to get convert them to a string to compare
      const expectResponse = {
        user: {
          ...userInDB,
          createdAt: userInDB.createdAt.toISOString(),
          updatedAt: userInDB.updatedAt.toISOString(),
        },
      };

      expect(response.body).toStrictEqual(expectResponse);
      expect(cookie).toMatch(/^stackSessionId/);
    });

    it('should fail when there is no user in the db with a particallar email login', async () => {
      const user = {
        email: 'testemail@email.com',
        username: 'testuser',
        password: 'bestpassword',
      };
      const userTryingToLogin = {
        ...user,
        email: 'noemailfound@email.com',
      };

      await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      const response = await request(app.app)
        .post('/api/auth/login')
        .send(userTryingToLogin)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404);
      const expectResponse = {
        error: 'There is no user with that email/password combination',
      };

      expect(response.body).toStrictEqual(expectResponse);
    });

    it('should fail when password dont match', async () => {
      const user = {
        email: 'testemail@email.com',
        username: 'testuser',
        password: 'bestpassword',
      };
      const userTryingToLogin = {
        ...user,
        password: 'wrongpassword',
      };

      await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      const response = await request(app.app)
        .post('/api/auth/login')
        .send(userTryingToLogin)
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
    it('should successfully logout', async () => {
      const user = {
        email: 'exampleemail@exemail.com',
        username: 'user54929',
        password: 'bestpassword',
      };

      const userInDB = await connection
        .getRepository<User>(User)
        .create(user)
        .save();

      const loginResponse = await request(app.app)
        .post('/api/auth/login')
        .send(user)
        .set('Accept', 'application/json');

      const logoutResponse = await request(app.app)
        .post('/api/auth/logout')
        .set('Cookie', loginResponse.header['set-cookie'])
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
      const expectResponse = {
        message: `${userInDB.username} logged out successfully`,
      };
      expect(logoutResponse.body).toStrictEqual(expectResponse);
    });
  });
});
