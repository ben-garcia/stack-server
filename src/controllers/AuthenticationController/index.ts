import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';
import bcrypt from 'bcrypt';

import { User } from '../../entity';
import { Controller } from '../types';

class AuthenticationController implements Controller {
  public path: string;
  public router: Router;
  public userRepository: Repository<User>;
  public schema: ObjectSchema;

  constructor() {
    this.path = '/auth';
    this.router = express.Router();
    this.userRepository = getRepository(User);
    this.schema = Joi.object({
      username: Joi.string()
        .trim()
        .alphanum()
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
  }

  public registerUser = async (req: Request, res: Response) => {
    try {
      const validatedUser = await this.schema.validateAsync(req.body);

      // check for any records that match req.body
      // if any record is found matching either email or username
      // then send detailed error message.
      await this.userRepository.findOne({
        email: req.body.email,
        username: req.body.username,
      });

      // create a new record in the db.
      await this.userRepository
        .create({
          email: validatedUser.email,
          password: validatedUser.password,
          username: validatedUser.username,
        })
        .save();

      res.status(201).json({ status: 'User Created' });
    } catch (e) {
      res.status(409).json({ error: e.detail });
    }
  };

  public loginUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userRepository.findOne({
        where: { email: req.body.email },
      });

      // if the user was not found in the db
      if (!user) {
        res.status(404).json({
          message: 'There is no user with that username/password combination',
        });
      } else {
        // if a user is found then compare password
        const match = bcrypt.compare(req.body.password, user.password);
        if (!match) {
          res.status(404).json({
            message: 'There is no user with that username/password combination',
          });
        }

        // add the user id and username to the session
        if (req.session && req.method === 'POST') {
          req.session.userId = user.id;
          req.session.username = user.username;
        }

        // don't send the user's password
        delete user.password;

        res.status(200).json({ user });
      }
    } catch (e) {
      // eslint-disable-next-line
      console.log('Error: ', e);
      res
        .status(409)
        .json({ error: 'No user with that email/password combination' });
    }
  };
}

export default AuthenticationController;
