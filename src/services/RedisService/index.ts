import { Redis } from 'ioredis';

import { Channel, DirectMessage, Message, Workspace } from '../../entity';

interface Teammate {
  id: number;
  username: string;
}

type Entity =
  | Channel[]
  | DirectMessage[]
  | Message[]
  | Teammate[]
  | Workspace[];

class RedisService {
  private redisClient: Redis;

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  deleteKey(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  saveKey(key: string, entity: Entity): Promise<'OK'> {
    return this.redisClient.setex(key, 60 * 30, JSON.stringify(entity));
  }
}

export default RedisService;
