import 'reflect-metadata';
import { createConnection } from 'typeorm';

import App from './App';
import AuthenticationController from './controllers/AuthenticationController';

(async () => {
  try {
    await createConnection(); // create a single connection
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error while connecting to the database', error);
  }

  // eslint-disable-next-line no-console
  console.log('Connection to the db established.');

  const app = new App([new AuthenticationController()]);

  app.listen();
})();
