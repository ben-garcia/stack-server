import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import { User, Workspace } from '../entity';
import { Controller } from './types';

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
    this.router.get('/', this.getUsersWorkspaces);
    this.router.post('/', this.createWorkspace);
  }

  public getUsersWorkspaces = async (req: Request, res: Response) => {
    try {
      const workspaces = await this.workspaceRepository.find({
        where: { owner: Number(req.query.userId) },
      });
      res.status(200).json({ workspaces });
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

      // if no errors then add the record
      const workspace = await this.workspaceRepository
        .create({
          name: validatedWorkspace.name,
          owner: user,
        })
        .save();

      // remove the user before sending it
      delete workspace.owner;

      res.status(201).json({ message: 'Workspace Created', workspace });
    } catch (e) {
      res.status(409).json({ error: e });
    }
  };
}

export default WorkspaceController;
