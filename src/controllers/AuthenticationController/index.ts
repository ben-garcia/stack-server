import express, { Request, Response, Router } from 'express';
import Joi, { ObjectSchema } from '@hapi/joi';
import bcrypt from 'bcrypt';

import { UserService } from '../../services';
import { Controller } from '../types';

class AuthenticationController implements Controller {
  public path: string;
  public router: Router;
  public userService: UserService;
  public schema: ObjectSchema;

  constructor(userService: UserService) {
    this.path = '/auth';
    this.router = express.Router();
    this.userService = userService;
    this.schema = Joi.object({
      username: Joi.string()
        .trim()
        .alphanum()
        .min(6)
        .required(),
      password: Joi.string()
        .trim()
        .pattern(/^[a-zA-Z0-9]{6,50}$/),
      email: Joi.string()
        .trim()
        .email({
          minDomainSegments: 2,
          tlds: { allow: ['com', 'net'] },
        }),
    });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/register', this.registerUser);
    this.router.post('/login', this.loginUser);
    this.router.post('/logout', this.logoutUser);
  }

  public registerUser = async (req: Request, res: Response) => {
    try {
      const validatedUser = await this.schema.validateAsync(req.body);
      const errors = [];

      // qeury the db for any user with the same email
      const emailUser = await this.userService.getByEmail(validatedUser.email);
      // qeury the db for any user with the same username
      const usernameUser = await this.userService.getByUsername(
        validatedUser.username
      );
      if (emailUser) {
        // if there is a user with the email
        errors.push('User with that email already exists');
        // res.status(409).json({ error: 'User with that email already exists' });
      }
      if (usernameUser) {
        // if there is a user with the username
        errors.push('User with that username already exists');
      }

      if (!emailUser && !usernameUser) {
        // create a new record in the db.
        await this.userService.create({
          email: validatedUser.email,
          password: validatedUser.password,
          username: validatedUser.username,
        });

        res.status(201).json({ message: 'User Created' });
      } else {
        res.status(409).json({ error: errors });
      }
    } catch (e) {
      res.status(400).json({ error: e.detail });
    }
  };

  public loginUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getByEmail(req.body.email);

      // if the user was not found in the db
      if (!user) {
        res.status(404).json({
          error: 'There is no user with that email/password combination',
        });
      } else {
        // if a user is found then compare password
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
          res.status(404).json({
            error: 'There is no user with that email/password combination',
          });
        }

        if (user && match) {
          // add the user id and username to the session
          if (req.session && req.method === 'POST') {
            req.session.userId = user.id;
            req.session.username = user.username;
          }

          // don't send the user's password
          delete user.password;

          res.status(200).json({ user });
        }
      }
    } catch (e) {
      // getting error when running unit test
      // eslint-disable-next-line
      // console.log('loginUser error: ', e);
      res
        .status(409)
        .json({ error: 'No user with that email/password combination' });
    }
  };

  public logoutUser = (req: Request, res: Response) => {
    const { username } = req.session!;
    req.session!.destroy(err => {
      if (err) {
        // eslint-disable-next-line
        console.log('err in logoutUser: ', err);
      } else {
        res
          .status(200)
          .json({ message: `${username} logged out successfully` });
      }
    });
  };
}

export default AuthenticationController;
