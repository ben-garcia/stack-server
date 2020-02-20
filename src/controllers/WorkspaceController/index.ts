import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import { User, Workspace } from '../../entity';
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
    this.router.get('/', this.getUserWorkspaces);
    this.router.get('/:workspaceId', this.getWorkspaceTeammates);
    this.router.post('/', this.createWorkspace);
    this.router.put('/:workspaceId', this.updateWorkspace);
  }

  public getUserWorkspaces = async (req: Request, res: Response) => {
    try {
      const workspaces = await this.workspaceRepository.find({
        where: { owner: Number(req.query.userId) },
      });
      res.status(200).json({ workspaces });
    } catch (e) {
      res.json({ error: e });
    }
  };

  public getWorkspaceTeammates = async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
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

      // TODO: get the ownerId from session
      // for now its ok since I am using POSTman
      // get the user from the db
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
      const teammates: User[] = [];
      const invalidUsernames: string[] = [];
      // // get the correct workspace from db
      const workspace = await this.workspaceRepository.findOne({
        where: {
          id: Number(workspaceId),
        },
        relations: ['teammates'],
      });

      const usernames = Object.values(req.body);
      let user: User | undefined;

      usernames.forEach(async (u, i) => {
        user = await getRepository(User).findOne({ where: { username: u } });

        if (user) {
          // don't send user's password to the client
          delete user.password;
          teammates.push(user);
        } else {
          invalidUsernames.push(u as string);
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
