import { Connection } from 'typeorm';
import App from '../App';
import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  MessageController,
  WorkspaceController,
} from '../controllers';
import { createTypeormConnection } from '.';

let connection: Connection;

/**
 * Create Typeorm connection
 * and initialize the app
 */
export const connectToTestDatabase = async () => {
  try {
    connection = await createTypeormConnection();
  } catch (e) {
    // eslint-disable-next-line
    console.log('connectToTestDatabase error: ', e);
  }

  const app: App = new App([
    new AuthenticationController(),
    new ChannelController(),
    new DirectMessageController(),
    new MessageController(),
    new WorkspaceController(),
  ]);
  return app.app;
};

export const closeTestDatabase = async () => {
  try {
    if (connection.isConnected) {
      await connection.close();
    }
  } catch (e) {
    // eslint-disable-next-line
    console.log('closeTestDatabase error:', e);
  }
};
