import Joi, { ObjectSchema } from '@hapi/joi';
import express, { Request, Response, Router } from 'express';
import { RedisClient } from 'redis';
import { getRepository, Repository } from 'typeorm';

import { DirectMessage, User } from '../../entity';
import { checkRedis, checkUserSession } from '../../middlewares';
import { Controller } from '../types';
import { createRedisClient } from '../../utils';

class DirectMessageController implements Controller {
  public directMessageRepository: Repository<DirectMessage>;
  public path: string;
  public redisClient: RedisClient;
  public router: Router;
  public schema: ObjectSchema;

  constructor() {
    this.directMessageRepository = getRepository(DirectMessage);
    this.path = '/direct-messages';
    this.redisClient = createRedisClient();
    this.router = express.Router();
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
    this.router.get(
      '/',
      checkUserSession,
      checkRedis,
      this.getUserDirectMessages
    );
    this.router.post('/', checkUserSession, this.createDirectMessage);
  }

  public getUserDirectMessages = async (req: Request, res: Response) => {
    try {
      // get the channel id and workspace id
      const { teammateId, workspaceId } = req.query;
      const { userId, username } = req.session!;
      const user = await getRepository(User).findOne({
        where: { id: Number(userId) },
      });
      if (user) {
        // get the correct channel from the db
        const directMessages = await this.directMessageRepository.find({
          where: [
            {
              user: Number(teammateId),
              workspaceId: Number(workspaceId),
            },
            {
              user: Number(userId),
              workspaceId: Number(workspaceId),
            },
          ],
          relations: ['user'],
          order: { createdAt: 'ASC' },
        });

        // quick fix, there should be a better way to do this in typeorm
        directMessages.forEach((m: DirectMessage) => {
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

        // make sure that the user has at least 1 direct message with teammate
        if (directMessages.length > 0) {
          // save to Redis with a 1 hour expiration
          this.redisClient.setex(
            `user:${userId}-${username}:directMessages`,
            60 * 60,
            JSON.stringify(directMessages)
          );
        }
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
      const { userId: sessionUserId, username } = req.session!;
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

        // Having added a another direct message, delete directMessages from Redis
        // which will cause the server to qeury the db for the updated list
        this.redisClient.del(
          `user:${sessionUserId}-${username}:directMessages`
        );

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
