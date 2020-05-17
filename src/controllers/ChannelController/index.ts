import Joi, { ObjectSchema } from '@hapi/joi';
import express, { Request, Response, Router } from 'express';
import redis, { RedisClient } from 'redis';
import { getRepository, Repository } from 'typeorm';

import { Channel, User, Workspace } from '../../entity';
import { checkRedis, checkUserSession } from '../../middlewares';
import { Controller } from '../types';

class ChannelController implements Controller {
  public channelRepository: Repository<Channel>;
  public path: string;
  public redisClient: RedisClient;
  public router: Router;
  public schema: ObjectSchema;

  constructor() {
    this.path = '/channels';
    this.redisClient = redis.createClient({ auth_pass: 'ben' });
    this.router = express.Router();
    this.channelRepository = getRepository(Channel);
    this.schema = Joi.object({
      name: Joi.string()
        .trim()
        .required(),
      description: Joi.string()
        .trim()
        .required(),
      private: Joi.boolean().required(),
      workspace: Joi.number().required(),
      members: Joi.array(),
    });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      '/',
      checkUserSession,
      checkRedis,
      this.getWorkspaceChannels
    );
    this.router.get(
      '/:channelId',
      checkUserSession,
      checkRedis,
      this.getChannelMembers
    );
    this.router.post('/', checkUserSession, this.createChannel);
    this.router.put('/:channelId', checkUserSession, this.updateChannel);
  }

  public getWorkspaceChannels = async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.query;
      // get session properties
      const { userId, username } = req.session!;
      // query the dd for all channels that belong to a particular workspace
      // and that that a particular user  as a member
      const channels = await this.channelRepository.query(
        `SELECT * FROM channels INNER JOIN channel_members ON channels.id = channel_members.channel and channel_members.user = ${userId} and channels."workspaceId" = ${workspaceId} ORDER BY channels.name;`
      );

      // make sure that the user has at least 1 channel
      if (channels.length > 0) {
        // save to Redis with a 1 hour expiration
        this.redisClient.setex(
          `user:${userId}-${username}:channels`,
          60 * 60,
          JSON.stringify(channels)
        );
      }

      res.status(200).json({ channels });
    } catch (e) {
      res.json({ error: e });
    }
  };

  public getChannelMembers = async (req: Request, res: Response) => {
    try {
      // get the channel id passed in as a parameter
      const { channelId } = req.params;
      // get the correct channel from the db
      // with members
      const channel = await this.channelRepository.findOne({
        where: { id: Number(channelId) },
        relations: ['members'],
      });
      // eslint-disable-next-line
      channel?.members.forEach((m: User) => {
        // eslint-disable-next-line
        delete m.createdAt;
        // eslint-disable-next-line
        delete m.email;
        // eslint-disable-next-line
        delete m.password;
        // eslint-disable-next-line
        delete m.updatedAt;
      });

      if (channel?.members!.length > 0) {
        // having passed userSession middleware
        const { userId, username } = req.session!;
        // save to Redis with a 1 hour expiration
        this.redisClient.setex(
          `user:${userId}-${username}:members`,
          60 * 60,
          JSON.stringify(channel?.members)
        );
      }

      // send members to the client
      res.status(200).json({ members: channel?.members });
    } catch (e) {
      // eslint-disable-next-line
      console.log('getChannelMembers Error: ', e);
      // send error
      res.json({ error: e });
    }
  };

  public createChannel = async (req: Request, res: Response) => {
    try {
      // verify that the channel being created matches schema.
      const validatedChannel = await this.schema.validateAsync(
        req.body.channel
      );
      // get the user id
      const { userId, username } = req.session!;
      // store the users to add as members
      const members: User[] = [];

      // get the creator of the channel
      const user = await getRepository(User).findOne({ id: Number(userId) });

      if (user) {
        members.push(user);
      }

      // only query the db if there is at least 2 members(including the user)
      // and channel should be set to public
      if (req.body.channel.members?.length > 1 && !validatedChannel.private) {
        req.body.channel.members.forEach(async (u: string) => {
          // query the db for the username
          const newMember = await getRepository(User).findOne({
            username: u,
          });

          // if there is record,
          // add it the members array
          if (newMember) {
            members.push(newMember);
          }
        });
      }

      const workspace = await getRepository(Workspace).findOne({
        id: Number(validatedChannel.workspace),
      });

      if (workspace) {
        // if no errors then add the record
        const channel = await this.channelRepository
          .create({
            name: validatedChannel.name,
            description: validatedChannel.description,
            private: validatedChannel.private,
            workspace,
            members: [...members],
          })
          .save();

        // remove the workspace before sending it
        delete channel.workspace;
        // remove the members before sending to the client
        delete channel?.members;

        // Having added a another channel, delete channels from Redis
        // which will cause the server to qeury the db for the updated list
        this.redisClient.del(`user:${userId}-${username}:channels`);

        res.status(201).json({ message: 'Channel Created', channel });
      }
    } catch (e) {
      // eslint-disable-next-line
      console.log('createChannel Error: ', e);
      res.status(409).json({ error: e });
    }
  };

  public updateChannel = async (req: Request, res: Response) => {
    try {
      const { userId, username } = req.session!;
      const { channelId } = req.params;

      if (
        req.body.members?.length > 0 &&
        !req.body.topic &&
        !req.body.description
      ) {
        const newMembers: User[] = [];

        // loop through the members passed in the body of the request object
        // and query the db for each user and
        // add it to the array of new members
        req.body.members.forEach(async (u: string) => {
          const user = await getRepository(User).findOne({
            where: { username: u },
          });

          // make sure there a user in the db
          if (user) {
            newMembers.push(user);
          }
        });

        // query the db for the correct channel
        const channel = await this.channelRepository.findOne({
          where: {
            id: Number(channelId),
          },
          relations: ['members'],
        });

        // update channel with new members
        channel!.members = [...channel!.members, ...newMembers];

        await channel!.save();

        res.status(200).json({ message: 'Channel members have been updated' });
      } else if (!req.body.members) {
        // update the channel's description or topic
        await this.channelRepository.update(Number(channelId), {
          ...req.body,
        });
        res.status(200).json({ message: 'Channel description/topic changed' });
      } else {
        // something has gone wrong
        res.status(400).json({ message: 'Something went wrong' });
      }
      // Having updated a channel, delete channels from Redis
      // which will cause the server to qeury the db for the updated list
      this.redisClient.del(`user:${userId}-${username}:channels`);
    } catch (e) {
      // eslint-disable-next-line
      console.log('ChannelController updateChannel error: ', e);
      res.status(409).json({ error: e });
    }
  };
}

export default ChannelController;
