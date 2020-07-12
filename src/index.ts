import 'reflect-metadata';
import { getRepository } from 'typeorm';

import App from './App';
import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  MessageController,
  WorkspaceController,
} from './controllers';
import { User } from './entity';
import { UserService } from './services';
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

  const app = new App([
    new AuthenticationController(new UserService(getRepository<User>(User))),
    new ChannelController(),
    new DirectMessageController(),
    new MessageController(),
    new WorkspaceController(),
  ]);

  app.listen();
})();
