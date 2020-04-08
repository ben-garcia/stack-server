import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import { DirectMessage, User } from '../../entity';
import { Controller } from '../types';

class DirectMessageController implements Controller {
  public path: string;
  public router: Router;
  public directMessageRepository: Repository<DirectMessage>;
  public schema: ObjectSchema;

  constructor() {
    this.path = '/direct-messages';
    this.router = express.Router();
    this.directMessageRepository = getRepository(DirectMessage);
    this.schema = Joi.object({
      content: Joi.string()
        .trim()
        .required(),
      user: Joi.number().required(),
      workspaceId: Joi.number().required(),
    });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getUserDirectMessages);
    this.router.post('/', this.createDirectMessage);
  }

  public getUserDirectMessages = async (req: Request, res: Response) => {
    try {
      // get the channel id and workspace id
      const { teammateId, workspaceId } = req.query;
      const user = await getRepository(User).findOne({
        where: { id: Number(teammateId) },
      });
      if (user) {
        // get the correct channel from the db
        const directMessages = await this.directMessageRepository.find({
          where: { user: user.id, workspaceId: Number(workspaceId) },
        });
        // send messages to the client
        res.status(200).json({ directMessages });
      } else {
        res.status(404).json({ message: 'Error' });
      }
    } catch (e) {
      // eslint-disable-next-line
      console.log('getUserDirectMessage Error: ', e);
      // send error
      res.json({ error: e });
    }
  };

  public createDirectMessage = async (req: Request, res: Response) => {
    try {
      // verify that the message being created matches schema.
      const validatedDirectMessage = await this.schema.validateAsync(
        req.body.message
      );
      const { user: userId, workspaceId } = req.body.message;
      // get the user who created the message from the db
      const user = await getRepository(User).findOne({
        where: {
          id: userId,
        },
      });

      let directMessage: DirectMessage | null = null;
      if (user) {
        directMessage = await this.directMessageRepository
          .create({
            content: validatedDirectMessage.content,
            user,
            workspaceId,
          })
          .save();

        //  remove the user before sending it
        delete directMessage.user;

        res.status(201).json({
          success: 'Direct Message Created',
          directMessage,
        });
      }
    } catch (e) {
      // eslint-disable-next-line
      console.log('createDirectMessage Error: ', e);
      res.status(409).json({ error: e });
    }
  };
}

export default DirectMessageController;
