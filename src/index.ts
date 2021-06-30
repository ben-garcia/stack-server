import 'reflect-metadata';
import Redis from 'ioredis';
import { getRepository } from 'typeorm';

import App from './App';
import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  MessageController,
  WorkspaceController,
} from './controllers';
import { Channel, DirectMessage, Message, User, Workspace } from './entity';
import {
  ChannelService,
  DirectMessageService,
  MessageService,
  RedisService,
  UserService,
  WorkspaceService,
} from './services';
import { createTypeormConnection } from './utils';

(async () => {
  try {
    await createTypeormConnection(); //
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error while connecting to the database', error);
  }

  // eslint-disable-next-line no-console
  console.log('Connection to the db established.');

  let redisClient: Redis.Redis;

  if (
    (process.env.REDIS_TLS_URL || process.env.REDIS_URL) &&
    process.env.NODE_ENV === 'production'
  ) {
    redisClient = new Redis(
      // after upgrading Heroku Redis from 5 to 6
      // @see https://devcenter.heroku.com/articles/heroku-redis-hobby-deprecation#updates-to-your-add-on-configuration
      process.env.REDIS_TLS_URL || process.env.REDIS_URL,
      {
        // skip certificate verification
        // @see https://devcenter.heroku.com/articles/heroku-redis
        tls: {
          rejectUnauthorized: false,
        },
      }
    );
  } else {
    // use localhost in development
    redisClient = new Redis({ password: 'ben' });
  }

  const app = new App([
    new AuthenticationController(new UserService(getRepository<User>(User))),
    new ChannelController(
      new ChannelService(getRepository<Channel>(Channel)),
      new RedisService(redisClient),
      new UserService(getRepository<User>(User)),
      new WorkspaceService(getRepository<Workspace>(Workspace))
    ),
    new DirectMessageController(
      new DirectMessageService(getRepository<DirectMessage>(DirectMessage)),
      new RedisService(redisClient),
      new UserService(getRepository<User>(User))
    ),
    new MessageController(
      new ChannelService(getRepository<Channel>(Channel)),
      new MessageService(getRepository<Message>(Message)),
      new RedisService(redisClient),
      new UserService(getRepository<User>(User))
    ),
    new WorkspaceController(
      new RedisService(redisClient),
      new UserService(getRepository<User>(User)),
      new WorkspaceService(getRepository<Workspace>(Workspace))
    ),
  ]);

  app.listen();
})();
