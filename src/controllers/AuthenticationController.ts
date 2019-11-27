import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';

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
    try {
      const user: User = await this.userRepository
        .create({
          email: req.body.email,
          password: req.body.password,
          username: req.body.username,
        })
        .save();

      res.status(201);
      res.json({ user });
    } catch (e) {
      res.status(400);
      res.json({ message: e.message });
    }
  };
}

export default AuthenticationController;
