import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import { User, Workspace } from '../../entity';
import { checkUserSession } from '../../middlewares';
import { Controller } from '../types';

class WorkspaceController implements Controller {
  public path: string;
  public router: Router;
  public workspaceRepository: Repository<Workspace>;
  public schema: ObjectSchema;

  constructor() {
    this.path = '/workspaces';
    this.router = express.Router();
    this.workspaceRepository = getRepository(Workspace);
    this.schema = Joi.object({
      name: Joi.string()
        .trim()
        .required(),
      owner: Joi.number(),
    });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', checkUserSession, this.getUserWorkspaces);
    this.router.get(
      '/:workspaceId',
      checkUserSession,
      this.getWorkspaceTeammates
    );
    this.router.post('/', checkUserSession, this.createWorkspace);
    this.router.put('/:workspaceId', checkUserSession, this.updateWorkspace);
  }

  public getUserWorkspaces = async (req: Request, res: Response) => {
    try {
      const { userId } = req.session!;

      // all workspaces that a user is a member
      // which are those that the user has created or have been invited to
      const workspaces = await this.workspaceRepository.query(
        `SELECT workspaces.id, workspaces.name, workspaces."ownerId" FROM workspaces INNER JOIN user_workspaces ON workspaces.id = user_workspaces.workspace INNER JOIN users ON user_workspaces.user = users.id and users.id = ${userId}`
      );

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

      res.status(201).json({ message: 'Workspace Created', workspace });
    } catch (e) {
      res.status(409).json({ error: e });
    }
  };

  public updateWorkspace = async (req: Request, res: Response) => {
    try {
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
      const usernames = Object.values(req.body);
      let user: User | undefined;

      usernames.forEach(async (username, i) => {
        // query the db for the user with username
        user = await getRepository(User).findOne({ where: { username } });

        if (user) {
          // don't send user's password to the client
          delete user.password;
          // valid teammate
          teammates.push(user);
        } else {
          // user doesn't exits
          invalidUsernames.push(username as string);
        }

        // when the loop reaches the last username
        // send them to the client
        if (i === usernames.length - 1) {
          // when there are no usernames found in the db
          // ONLY invalid usernames
          if (invalidUsernames.length > 0 && teammates.length === 0) {
            res
              .status(400)
              .json({ message: 'Username/s not in the db', invalidUsernames });
          } else if (
            teammates.length > 0 &&
            invalidUsernames.length === 0 &&
            workspace
          ) {
            // updated the workspace
            workspace.teammates = [...workspace.teammates, ...teammates];
            // save to the db
            await workspace.save();
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
    } catch (e) {
      res.status(409).json({ req, error: e });
    }
  };
}

export default WorkspaceController;
