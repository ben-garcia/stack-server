import { Repository } from 'typeorm';

import { DirectMessage } from '../../entity';

interface UserDTO {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DirectMessageDTO {
  content: string;
  user: UserDTO;
  workspaceId: number;
}

class DirectMessageService {
  private directMessageRepository: Repository<DirectMessage>;

  constructor(directMessageRepository: Repository<DirectMessage>) {
    this.directMessageRepository = directMessageRepository;
  }

  async getByIds(
    teammateId: number,
    workspaceId: number,
    userId: number
  ): Promise<DirectMessage[]> {
    return this.directMessageRepository.find({
      order: { createdAt: 'ASC' },
      relations: ['user'],
      where: [
        { user: teammateId, workspaceId },
        { user: userId, workspaceId },
      ],
    });
  }

  async create(directMessage: DirectMessageDTO): Promise<DirectMessage> {
    const newDirectMessage = this.directMessageRepository.create(directMessage);
    await this.directMessageRepository.save(newDirectMessage);

    return newDirectMessage;
  }
}

export default DirectMessageService;
