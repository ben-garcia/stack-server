import { Repository } from 'typeorm';

import { Message } from '../../entity';

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

interface MessageDTO {
  channel: ChannelDTO;
  content: string;
  user: UserDTO;
}

class MessageService {
  private messageRepository: Repository<Message>;

  constructor(messageRepository: Repository<Message>) {
    this.messageRepository = messageRepository;
  }

  async getAllByChannelId(channelId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: { channel: channelId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(message: MessageDTO): Promise<Message> {
    const newMessage = this.messageRepository.create(message);
    await this.messageRepository.save(newMessage);

    return newMessage;
  }
}

export default MessageService;
