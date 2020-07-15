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
import { Channel, Message, User, Workspace } from './entity';
import {
  ChannelService,
  MessageService,
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

  const app = new App([
    new AuthenticationController(new UserService(getRepository<User>(User))),
    new ChannelController(
      new ChannelService(getRepository<Channel>(Channel)),
      new UserService(getRepository<User>(User)),
      new WorkspaceService(getRepository<Workspace>(Workspace))
    ),
    new DirectMessageController(),
    new MessageController(
      new ChannelService(getRepository<Channel>(Channel)),
      new MessageService(getRepository<Message>(Message)),
      new UserService(getRepository<User>(User))
    ),
    new WorkspaceController(
      new UserService(getRepository<User>(User)),
      new WorkspaceService(getRepository<Workspace>(Workspace))
    ),
  ]);

  app.listen();
})();
