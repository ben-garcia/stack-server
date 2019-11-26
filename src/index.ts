import 'reflect-metadata';
import { createConnection } from 'typeorm';

import App from './App';
import DummyController from './controllers/DummyController';
// import Workspace from './entity/Workspace';
import User from './entity/User';
import Workspace from './entity/Workspace';

(async () => {
  try {
    const connection = await createConnection(); // create a single connection

    const userRepository = connection.getRepository(User);
    const users = await userRepository.findOne({
      where: { id: 1 },
      relations: ['workspaces'],
    });

    const workspacesRepository = connection.getRepository(Workspace);
    const workspaces = await workspacesRepository.find({
      relations: ['members'],
    });

    // eslint-disable-next-line no-console
    console.log(users);

    // eslint-disable-next-line no-console
    console.log(workspaces);

    // const category1 = new Workspace();
    // category1.name = 'animals';
    // await connection.manager.save(category1);

    // const category2 = new Workspace();
    // category2.name = 'zoo';
    // await connection.manager.save(category2);

    // const question = new User();
    // question.email = 'dogs';
    // question.password = 'who let the dogs out?';
    // question.username = 'gagagaggg';
    // question.workspaces = [category1, category2];
    // await connection.manager.save(question);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error while connecting to the database', error);
  }

  // eslint-disable-next-line no-console
  console.log('Connection to the db established.');

  const app = new App([new DummyController()]);

  app.listen();
})();
