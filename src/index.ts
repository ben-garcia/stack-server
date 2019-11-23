import 'reflect-metadata';
import { createConnection } from 'typeorm';

import App from './App';
import DummyController from './controllers/DummyController';
import User from './entity/User';

(async () => {
  try {
    const connection = await createConnection(); // create a single connection
    // create new use to insert into the db.
    const user = new User();
    user.firstName = 'john';
    user.lastName = 'doe';
    user.age = 25;

    // save the user to the db.
    await connection.manager.save(user);

    // eslint-disable-next-line no-console
    console.log('user saved: ', user);

    // query for all the users in the db.
    const allUsers = await connection.manager.find(User);
    // eslint-disable-next-line no-console
    console.log('all users: ', allUsers);
    // eslint-disable-next-line no-console
    console.log('Here you can setup and run express/koa/any other framework.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error while connecting to the database', error);
  }

  // eslint-disable-next-line no-console
  console.log('Connection to the db established.');

  const app = new App([new DummyController()]);

  app.listen();
})();
