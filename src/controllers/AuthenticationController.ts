import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import User from '../entity/User';
import { Controller } from './types';

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
  }

  public registerUser = async (req: Request, res: Response) => {
    try {
      const value = await this.schema.validateAsync(req.body);

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
          email: value.email,
          password: value.password,
          username: value.username,
        })
        .save();

      res.status(201).json({ status: 'User Created' });
    } catch (e) {
      res.status(409).json({ error: e.detail });
    }
  };
}

export default AuthenticationController;
