import { Repository } from 'typeorm';

import { User } from '../../entity';

export interface UserDTO {
  email: string;
  password: string;
  username: string;
}

class UserService {
  private userRepository: Repository<User>;

  constructor(userRepository: Repository<User>) {
    this.userRepository = userRepository;
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(user: UserDTO): Promise<User> {
    const newUser = this.userRepository.create(user);
    await this.userRepository.save(newUser);

    return newUser;
  }
}

export default UserService;
