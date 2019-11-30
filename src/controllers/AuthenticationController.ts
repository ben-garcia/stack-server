import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi from '@hapi/joi';

import User from '../entity/User';
import { Controller } from './types';

class AuthenticationController implements Controller {
  public path: string;
  public router: Router;
  public userRepository: Repository<User>;

  constructor() {
    this.path = '/auth';
    this.router = express.Router();
    this.userRepository = getRepository(User);

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/register', this.registerUser);
  }

  public registerUser = async (req: Request, res: Response) => {
    const schema = Joi.object({
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

    try {
      const value = await schema.validateAsync(req.body);
      const user: User = await this.userRepository
        .create({
          email: value.email,
          password: value.password,
          username: value.username,
        })
        .save();

      res.status(201).json({ user });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };
}

export default AuthenticationController;
