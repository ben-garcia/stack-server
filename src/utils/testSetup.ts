import App from '../App';
import {
  AuthenticationController,
  ChannelController,
  DirectMessageController,
  MessageController,
  WorkspaceController,
} from '../controllers';
import { createTypeormConnection } from '.';

/**
 * Create Typeorm connection
 * and initialize the app
 */
const testSetup = async () => {
  await createTypeormConnection();
  const app: App = new App([
    new AuthenticationController(),
    new ChannelController(),
    new DirectMessageController(),
    new MessageController(),
    new WorkspaceController(),
  ]);
  return app;
};

export default testSetup;
