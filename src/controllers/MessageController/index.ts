import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import { Channel, Message, User } from '../../entity';
import { Controller } from '../types';

class MessageController implements Controller {
  public path: string;
  public router: Router;
  public messageRepository: Repository<Message>;
  public schema: ObjectSchema;

  constructor() {
    this.path = '/messages';
    this.router = express.Router();
    this.messageRepository = getRepository(Message);
    this.schema = Joi.object({
      content: Joi.string()
        .trim()
        .required(),
      user: Joi.number().required(),
      channel: Joi.number().required(),
    });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', this.createMessage);
  }

  public createMessage = async (req: Request, res: Response) => {
    try {
      // verify that the message being created matches schema.
      const validatedMessage = await this.schema.validateAsync(
        req.body.message
      );
      const { channel: channelId, user: userId } = req.body.message;
      // get the channel to add the message
      const channel = await getRepository(Channel).findOne({
        where: {
          id: channelId,
        },
      });

      // get the user who created the message from the db
      const user = await getRepository(User).findOne({
        where: {
          id: userId,
        },
      });

      let message: Message | null = null;
      if (channel && user) {
        message = await this.messageRepository
          .create({
            channel,
            content: validatedMessage.content,
            user,
          })
          .save();

        // // remove the user before sending it
        delete message.user;
        // // remove the channel before sending to the client
        delete message.channel;

        res.status(201).json({
          success: 'Message Created',
          message,
        });
      }
    } catch (e) {
      // eslint-disable-next-line
      console.log('createMessage Error: ', e);
      res.status(409).json({ error: e });
    }
  };
}

export default MessageController;
