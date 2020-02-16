import express, { Request, Response, Router } from 'express';
import { getRepository, Repository } from 'typeorm';
import Joi, { ObjectSchema } from '@hapi/joi';

import { Channel, User, Workspace } from '../../entity';
import { Controller } from '../types';

class ChannelController implements Controller {
  public path: string;
  public router: Router;
  public channelRepository: Repository<Channel>;
  public schema: ObjectSchema;

  constructor() {
    this.path = '/channels';
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
    });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getWorkspaceChannels);
    this.router.get('/:channelId', this.getChannelMembers);
    this.router.post('/', this.createChannel);
    this.router.put('/:channelId', this.updateChannel);
  }

  public getWorkspaceChannels = async (req: Request, res: Response) => {
    try {
      const channels = await this.channelRepository.find({
        where: { workspace: Number(req.query.workspaceId) },
      });
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
      const { userId } = req.body;

      // get the creator of the channel
      const user = await getRepository(User).findOne({ id: Number(userId) });

      // TODO: get the ownerId from session
      // for now its ok since I am using POSTman
      // get the user from the db
      const workspace = await getRepository(Workspace).findOne({
        id: Number(validatedChannel.workspace),
      });

      // if no errors then add the record
      const channel = await this.channelRepository
        .create({
          name: validatedChannel.name,
          description: validatedChannel.description,
          private: validatedChannel.private,
          workspace,
          members: [user!],
        })
        .save();

      // remove the workspace before sending it
      delete channel.workspace;
      // remove the members before sending to the client
      delete channel.members;

      res.status(201).json({ message: 'Channel Created', channel });
    } catch (e) {
      // eslint-disable-next-line
      console.log('createChannel Error: ', e);
      res.status(409).json({ error: e });
    }
  };

  public updateChannel = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      // update
      await this.channelRepository.update(Number(channelId), {
        ...req.body,
      });

      res.status(200).json({ message: 'Channel Updated' });
    } catch (e) {
      res.status(409).json({ error: e });
    }
  };
}

export default ChannelController;
