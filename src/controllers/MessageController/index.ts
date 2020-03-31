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
    this.router.get('/', this.getChannelMessages);
    this.router.post('/', this.createMessage);
  }

  public getChannelMessages = async (req: Request, res: Response) => {
    try {
      // get the channel id passed in as a parameter
      const { channelId } = req.query;
      // get the correct channel from the db
      const messages = await this.messageRepository.find({
        where: { channel: Number(channelId) },
        relations: ['user'],
      });
      // quick fix, there should be a better way to do this in typeorm
      messages.forEach((m: Message) => {
        // eslint-disable-next-line
        delete m.user.password;
        // eslint-disable-next-line
        delete m.user.id;
        // eslint-disable-next-line
        delete m.user.email;
        // eslint-disable-next-line
        delete m.user.createdAt;
        // eslint-disable-next-line
        delete m.user.updatedAt;
      });

      // send messages to the client
      res.status(200).json({ messages });
    } catch (e) {
      // eslint-disable-next-line
      console.log('getChannelMessages Error: ', e);
      // send error
      res.json({ error: e });
    }
  };

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

        //  remove the user before sending it
        delete message.user;
        //  remove the channel before sending to the client
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
