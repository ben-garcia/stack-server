import { Repository } from 'typeorm';

import { User } from '../../entity';

interface userDTO {
  email: string;
  password: string;
  username: string;
}

class UserService {
  private userRepository: Repository<User>;

  constructor(userRepository: Repository<User>) {
    this.userRepository = userRepository;
  }

  async getByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getById(id: number | string): Promise<User | undefined> {
    return this.userRepository.findOne(id);
  }

  async getByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(user: userDTO): Promise<User> {
    const newUser = this.userRepository.create(user);
    await this.userRepository.save(newUser);

    return newUser;
  }
}

export default UserService;
