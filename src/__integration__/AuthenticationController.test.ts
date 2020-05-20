// eslint-disable-next-line
import request, { Response } from 'supertest';

import {
  registerUser,
  registerUserWithInvalidEmail,
  registerUserWithInvalidPassword,
  registerUserWithInvalidUsername,
} from './fixtures';
import { User } from '../entity';
import { testSetup } from '../utils';
import App from '../App';

describe('AuthenticationControler Integration', () => {
  let app: App;
  beforeAll(async () => {
    app = await testSetup();
  });

  describe('register user', () => {
    it('successful', done => {
      request(app.app)
        .post('/api/auth/register')
        .send(registerUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(async ({ body }: Response) => {
          expect(body).toEqual({ message: 'User Created' });
          try {
            const users = await User.find({ username: registerUser.username });
            expect(users.length).toBe(1);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should save to db if there is already a user with same username', async done => {
      try {
        const users = await User.find({ username: registerUser.username });
        expect(users.length).toBe(1);
        done();
      } catch (e) {
        done(e);
      }
      request(app.app)
        .post('/api/auth/register')
        .send(registerUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(409)
        .then(async ({ body: { error } }: Response) => {
          try {
            expect(error).toBe('User with that username already exists');
            const users = await User.find({ username: registerUser.username });
            expect(users.length).toBe(1);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not save db if username.length < 6', done => {
      request(app.app)
        .post('/api/auth/register')
        .send(registerUserWithInvalidUsername)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(async ({ body: { error } }: Response) => {
          try {
            expect(error[0].message).toBe(
              '"username" length must be at least 6 characters long'
            );
            const users = await User.find({
              username: registerUserWithInvalidUsername.username,
            });
            expect(users.length).toBe(0);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not save to db if password does not match pattern', done => {
      request(app.app)
        .post('/api/auth/register')
        .send(registerUserWithInvalidPassword)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(async ({ body: { error } }: Response) => {
          try {
            expect(error[0].message).toBe(
              '"password" with value "12345" fails to match the required pattern: /^[a-zA-Z0-9]{6,50}$/'
            );
            const users = await User.find({
              username: registerUserWithInvalidPassword.username,
            });
            expect(users.length).toBe(0);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not save to db if email is invalid', done => {
      request(app.app)
        .post('/api/auth/register')
        .send(registerUserWithInvalidEmail)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(async ({ body: { error } }: Response) => {
          try {
            expect(error[0].message).toBe('"email" must be a valid email');
            const users = await User.find({
              username: registerUserWithInvalidEmail.username,
            });
            expect(users.length).toBe(0);
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });

  describe('login user', () => {
    it('successful', done => {
      request(app.app)
        .post('/api/auth/login')
        .send(registerUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(async (response: Response) => {
          const { user } = response.body;
          const setCookie = response.header['set-cookie'][0];
          expect(user.id).toBeDefined();
          expect(user.email).toBe(registerUser.email);
          expect(user.username).toBe(registerUser.username);
          expect(user.createdAt).toBeDefined();
          expect(user.updatedAt).toBeDefined();
          // check server doesnn't send user.password
          expect(user.password).not.toBeDefined();
          // check session cookie
          expect(setCookie).toMatch(/stackSessionId/);
          try {
            const dbUser = await User.findOne({
              username: registerUser.username,
            });
            expect(dbUser!).toBeDefined();
            // check user the server sends back
            // with the user in the db
            expect(dbUser!.id).toBe(user.id);
            expect(dbUser!.username).toBe(user.username);
            expect(dbUser!.email).toBe(user.email);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 404 for duplicate user with same email', () => {
      request(app.app)
        .post('/api/auth/login')
        .send({ ...registerUser, email: 'username123@example.com' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
        .then((response: Response) => {
          const { error } = response.body;
          const setCookie = response.header['set-cookie'];
          expect(error).toBe(
            'There is no user with that email/password combination'
          );
          expect(setCookie).not.toBeDefined();
        });
    });

    it('should return 404 when password dont match', () => {
      request(app.app)
        .post('/api/auth/login')
        .send({ ...registerUser, password: 'password123' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
        .then((response: Response) => {
          const { error } = response.body;
          const setCookie = response.header['set-cookie'];
          expect(error).toBe(
            'There is no user with that email/password combination'
          );
          expect(setCookie).not.toBeDefined();
        });
    });
  });
});
