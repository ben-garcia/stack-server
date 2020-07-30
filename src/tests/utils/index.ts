import Redis from 'ioredis';
import { getRepository, Connection } from 'typeorm';

import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  MessageController,
  WorkspaceController,
} from '../../controllers';
import {
  ChannelService,
  DirectMessageService,
  MessageService,
  RedisService,
  UserService,
  WorkspaceService,
} from '../../services';
import { Channel, DirectMessage, Message, User, Workspace } from '../../entity';
import App from '../../App';

type Entities =
  | 'users'
  | 'workspaces'
  | 'channels'
  | 'messages'
  | 'directMessages';

class TestUtils {
  private connection: Connection;
  private app: App;

  constructor(connection: Connection) {
    this.connection = connection;
    this.initApp();
  }

  async clearTables(...tables: Entities[]): Promise<void> {
    if (tables.includes('messages')) {
      await this.connection
        .getRepository<Message>(Message)
        .query('DELETE FROM messages');
    }
    if (tables.includes('directMessages')) {
      await this.connection
        .getRepository<DirectMessage>(DirectMessage)
        .query('DELETE FROM direct_messages');
    }
    if (tables.includes('channels')) {
      await this.connection
        .getRepository<Channel>(Channel)
        .query('DELETE FROM channels');
    }
    if (tables.includes('workspaces')) {
      await this.connection
        .getRepository<Workspace>(Workspace)
        .query('DELETE FROM workspaces');
    }
    if (tables.includes('users')) {
      await this.connection
        .getRepository<User>(User)
        .query('DELETE FROM users');
    }
  }

  async closeConnection(): Promise<void> {
    await this.connection.close();
  }

  getApp() {
    return this.app.app;
  }

  getConnection(): Connection {
    return this.connection;
  }

  initApp(): void {
    this.app = new App([
      new AuthenticationController(new UserService(getRepository<User>(User))),
      new ChannelController(
        new ChannelService(getRepository<Channel>(Channel)),
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User)),
        new WorkspaceService(getRepository<Workspace>(Workspace))
      ),
      new DirectMessageController(
        new DirectMessageService(getRepository<DirectMessage>(DirectMessage)),
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User))
      ),
      new MessageController(
        new ChannelService(getRepository<Channel>(Channel)),
        new MessageService(getRepository<Message>(Message)),
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User))
      ),
      new WorkspaceController(
        new RedisService(new Redis({ password: 'ben' })),
        new UserService(getRepository<User>(User)),
        new WorkspaceService(getRepository<Workspace>(Workspace))
      ),
    ]);
  }
}
export default TestUtils;
