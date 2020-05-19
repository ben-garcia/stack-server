// eslint-disable-next-line
import request, { Response } from 'supertest';

import App from '../App';
import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  MessageController,
  WorkspaceController,
} from '../controllers';
import {
  registerUser,
  registerUserWithInvalidEmail,
  registerUserWithInvalidPassword,
  registerUserWithInvalidUsername,
} from './fixtures';
import { User } from '../entity';
import { createTypeormConnection } from '../utils';

let app: App;

describe('AuthenticationControler Integration', () => {
  beforeAll(async () => {
    await createTypeormConnection();
    app = new App([
      new AuthenticationController(),
      new ChannelController(),
      new DirectMessageController(),
      new MessageController(),
      new WorkspaceController(),
    ]);
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
});
