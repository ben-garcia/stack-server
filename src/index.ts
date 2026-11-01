import 'reflect-metadata';
import Redis from 'ioredis';

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
import {
  createTypeormConnection,
  AppDataSource,
} from './utils/createTypeormConnection';

(async () => {
  try {
    await createTypeormConnection(); //
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error while connecting to the database', error);
  }

  // eslint-disable-next-line no-console
  console.log('Connection to the db established.');

  let redisClient: Redis;

  if (
    (process.env.REDIS_TLS_URL || process.env.REDIS_URL) &&
    process.env.NODE_ENV === 'production'
  ) {
    // Store the URL in a local constant first so TypeScript can narrow its type safely
    // after upgrading Heroku Redis from 5 to 6
    // @see https://devcenter.heroku.com/articles/heroku-redis-hobby-deprecation#updates-to-your-add-on-configuration
    const redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL;

    redisClient = new Redis(redisUrl as any, {
      // skip certificate verification
      // @see https://devcenter.heroku.com/articles/heroku-redis
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // use localhost in development
    redisClient = new Redis({ password: 'ben' });
  }

  // Add error handler
  redisClient.on('error', err => {
    console.error('Redis connection error:', err);
  });

  const app = new App(
    [
      new AuthenticationController(
        new UserService(AppDataSource.getRepository<User>(User))
      ),
      new ChannelController(
        new ChannelService(AppDataSource.getRepository<Channel>(Channel)),
        new RedisService(redisClient),
        new UserService(AppDataSource.getRepository<User>(User)),
        new WorkspaceService(AppDataSource.getRepository<Workspace>(Workspace))
      ),
      new DirectMessageController(
        new DirectMessageService(
          AppDataSource.getRepository<DirectMessage>(DirectMessage)
        ),
        new RedisService(redisClient),
        new UserService(AppDataSource.getRepository<User>(User))
      ),
      new MessageController(
        new ChannelService(AppDataSource.getRepository<Channel>(Channel)),
        new MessageService(AppDataSource.getRepository<Message>(Message)),
        new RedisService(redisClient),
        new UserService(AppDataSource.getRepository<User>(User))
      ),
      new WorkspaceController(
        new RedisService(redisClient),
        new UserService(AppDataSource.getRepository<User>(User)),
        new WorkspaceService(AppDataSource.getRepository<Workspace>(Workspace))
      ),
    ],
    redisClient
  );

  app.listen();
})();
