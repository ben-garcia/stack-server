import Joi, { ObjectSchema } from '@hapi/joi';
import express, { Request, Response, Router } from 'express';
import { Redis } from 'ioredis';
import { getRepository, Repository } from 'typeorm';

import { User, Workspace } from '../../entity';
import {
  checkForTestAccounts,
  checkRedis,
  checkUserSession,
} from '../../middlewares';
import { Controller } from '../types';
import { createRedisClient } from '../../utils';

class WorkspaceController implements Controller {
  public path: string;
  public redisClient: Redis;
  public router: Router;
  public schema: ObjectSchema;
  public workspaceRepository: Repository<Workspace>;

  constructor() {
    this.path = '/workspaces';
    this.redisClient = createRedisClient();
    this.router = express.Router();
    this.schema = Joi.object({
      name: Joi.string()
        .trim()
        .required(),
      owner: Joi.number(),
    });
    this.workspaceRepository = getRepository(Workspace);

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', checkUserSession, checkRedis, this.getUserWorkspaces);
    this.router.get(
      '/:workspaceId',
      checkUserSession,
      checkRedis,
      this.getWorkspaceTeammates
    );
    this.router.post(
      '/',
      checkUserSession,
      checkForTestAccounts,
      this.createWorkspace
    );
    this.router.put(
      '/:workspaceId',
      checkUserSession,
      checkForTestAccounts,
      this.updateWorkspace
    );
  }

  public getUserWorkspaces = async (req: Request, res: Response) => {
    try {
      const { userId, username } = req.session!;
      // all workspaces that a user is a member
      // which are those that the user has created or have been invited to
      const workspaces = await this.workspaceRepository.query(
        `SELECT workspaces.id, workspaces.name, workspaces."ownerId" FROM workspaces INNER JOIN user_workspaces ON workspaces.id = user_workspaces.workspace INNER JOIN users ON user_workspaces.user = users.id and users.id = ${userId}`
      );

      // make sure that the user has at least 1 workspace
      if (workspaces.length > 0) {
        // save to Redis with a 1 hour expiration
        this.redisClient.setex(
          `user:${userId}-${username}:workspaces`,
          60 * 30, // 30 minutes
          JSON.stringify(workspaces)
        );
      }

      res.status(200).json({ workspaces });
    } catch (e) {
      res.json({ error: e });
    }
  };

  public getWorkspaceTeammates = async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
      // find the workspace in the db
      const workspace = await this.workspaceRepository.findOne({
        where: { id: Number(workspaceId) },
        relations: ['teammates'],
      });
      const teammates: { id: number; username: string }[] = [];

      /* eslint-disable no-unused-expressions */
      workspace?.teammates.forEach(m => {
        teammates.push({ id: m.id, username: m.username });
      });

      if (teammates.length > 0) {
        // having passed userSession middleware
        const { userId, username } = req.session!;
        // save to Redis with a 1 hour expiration
        this.redisClient.setex(
          `user:${userId}-${username}:teammates`,
          60 * 30, // 30 minutes
          JSON.stringify(teammates)
        );
      }

      res.status(200).json({
        message: 'Workspace teammates found',
        teammates,
      });
    } catch (e) {
      res.json({ error: e });
    }
  };

  public createWorkspace = async (req: Request, res: Response) => {
    try {
      // verify that the workspace being created matches schema.
      const validatedWorkspace = await this.schema.validateAsync(req.body);
      const user = await getRepository(User).findOne({
        id: Number(validatedWorkspace.owner),
      });
      let workspace;
      const { userId, username } = req.session!;

      if (user) {
        // if no errors then add the record
        workspace = await this.workspaceRepository
          .create({
            name: validatedWorkspace.name,
            owner: user,
            teammates: [user],
          })
          .save();

        // remove the user before sending it
        delete workspace.owner;
        delete workspace.teammates;
      }

      // Having added a another workspace, delete workspaces from Redis
      // which will cause the server to qeury the db for the updated list
      this.redisClient.del(`user:${userId}-${username}:workspaces`);

      res.status(201).json({ message: 'Workspace Created', workspace });
    } catch (e) {
      res.status(409).json({ error: e });
    }
  };

  public updateWorkspace = async (req: Request, res: Response) => {
    try {
      const { userId, username } = req.session!;
      const { workspaceId } = req.params;
      // list of users that have been validated
      const teammates: User[] = [];
      // list of users that don't exitst in the database
      const invalidUsernames: string[] = [];
      // // get the correct workspace from db
      const workspace = await this.workspaceRepository.findOne({
        where: {
          id: Number(workspaceId),
        },
        relations: ['teammates'],
      });

      // get the usernames passed in the request body
      let usernames = Object.values(req.body);

      let user: User | undefined;

      // prevent adding a test account as a teammate
      usernames = usernames.filter(
        u => u !== 'stackguest' && u !== 'stacktestuser'
      );

      if (usernames.length > 0) {
        usernames.forEach(async (u, i) => {
          // query the db for the user with username
          user = await getRepository(User).findOne({ where: { username: u } });

          if (user) {
            // don't send user's password to the client
            delete user.password;
            // valid teammate
            teammates.push(user);
          } else {
            // user doesn't exits
            invalidUsernames.push(u as string);
          }

          // when the loop reaches the last username
          // send them to the client
          if (i === usernames.length - 1) {
            // when there are no usernames found in the db
            // ONLY invalid usernames
            if (invalidUsernames.length > 0 && teammates.length === 0) {
              res.status(400).json({
                message: 'Username/s not in the db',
                invalidUsernames,
              });
            } else if (
              teammates.length > 0 &&
              invalidUsernames.length === 0 &&
              workspace
            ) {
              // updated the workspace
              workspace.teammates = [...workspace.teammates, ...teammates];
              // save to the db
              await workspace.save();

              // Having added a another workspace, delete workspaces from Redis
              // which will cause the server to qeury the db for the updated list
              this.redisClient.del(`user:${userId}-${username}:teammates`);

              // when there are no invalid usernames
              // ONLY valid users in the db
              // send the teammates that were added
              // back to the client
              res.status(200).json({
                message: 'Member/s Added',
                teammates,
              });
            } else {
              // when there is a mix of both
              if (workspace) {
                // update workspace with the  validated usernames
                workspace.teammates = [...workspace.teammates, ...teammates];
                await workspace.save();
              }
              // send new teammates and invalid usernames to the client
              res.status(200).json({ teammates, invalidUsernames });
            }
          }
        });
      } else {
        // when the user tries to add a test account
        res.status(403).json({ error: 'Cannot add a testing account' });
      }
    } catch (e) {
      res.status(409).json({ req, error: e });
    }
  };
}

export default WorkspaceController;
