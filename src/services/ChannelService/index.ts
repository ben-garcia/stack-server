import { Repository } from 'typeorm';

import { Channel } from '../../entity';

interface UserDTO {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceDTO {
  id: number;
  name: string;
  owner: UserDTO;
  teammates: UserDTO[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelDTO {
  name: string;
  description: string;
  private: boolean;
  workspace: WorkspaceDTO;
  members: UserDTO[];
}

interface UpdateChannelDTO {
  name?: string;
  description?: string;
}

class ChannelService {
  private channelRepository: Repository<Channel>;

  constructor(channelRepository: Repository<Channel>) {
    this.channelRepository = channelRepository;
  }

  async getById(channelId: number): Promise<Channel | undefined> {
    return this.channelRepository.findOne(channelId);
  }

  async getChannelsByIds(
    userId: string,
    workspaceId: string
  ): Promise<Channel[]> {
    return this.channelRepository.query(`
		    SELECT * FROM channels INNER JOIN channel_members ON channels.id = channel_members.channel AND channel_members.user = ${userId} AND channels."workspaceId" = ${workspaceId} ORDER BY channels.name
    `);
  }

  async getMembersByChannelId(channelId: number): Promise<Channel | undefined> {
    return this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['members'],
    });
  }

  async create(channel: ChannelDTO): Promise<Channel> {
    const newChannel = this.channelRepository.create(channel);
    await this.channelRepository.save(newChannel);

    return newChannel;
  }

  async update(channelId: number, channel: UpdateChannelDTO) {
    return this.channelRepository.update(channelId, channel);
  }
}

export default ChannelService;
