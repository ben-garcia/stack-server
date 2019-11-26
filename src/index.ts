import 'reflect-metadata';
import { createConnection } from 'typeorm';

import App from './App';
import DummyController from './controllers/DummyController';
// import User from './entity/User';
// import Workspace from './entity/Workspace';
// import Channel from './entity/Channel';
// import Message from './entity/Message';

(async () => {
  try {
    await createConnection(); // create a single connection

    /*
    *  channel.messages
    *  channel.workspace
    *  message.channel
    *  message.user
    *
    const message1 = new Message();
    message1.content = 'first message';
    await connection.manager.save(message1);

    const message2 = new Message();
    message2.content = 'talk about random';
    await connection.manager.save(message2);

    const channelRepository = connection.getRepository(Channel);
    const channel = await channelRepository.findOne({
      where: { id: 2 },
      relations: ['messages', 'workspace'],
    });

    (channel as Channel).messages = [message1, message2];
    await connection.manager.save(channel);

    // eslint-disable-next-line no-console
    console.log('--Channel: ', channel);

    const messageRepository = connection.getRepository(Message);
    const messages = await messageRepository.find({
      relations: ['channel', 'user'],
    });

    // eslint-disable-next-line no-console
    console.log('---Messages: ', messages);
    */

    /* channel.messages
    *  channel.workspace
    *
    const channel1 = new Channel();
    channel1.description = 'talk about anything';
    channel1.name = '#general';
    await connection.manager.save(channel1);

    const channel2 = new Channel();
    channel2.description = 'talk about random';
    channel2.name = '#random';
    await connection.manager.save(channel2);

    const workspaceRepository = connection.getRepository(Workspace);
    const workspace = await workspaceRepository.findOne({
      where: { id: 1 },
      relations: ['members', 'channels'],
    });

    (workspace as Workspace).channels = [channel1, channel2];
    await connection.manager.save(workspace);

    // eslint-disable-next-line no-console
    console.log('workspace: ', workspace);

    const channelRepository = connection.getRepository(Channel);
    const channels = await channelRepository.find({
      relations: ['workspace'],
    });

    // eslint-disable-next-line no-console
    console.log('workspace: ', channels);
    */

    /* user.messages
    *
    const message1 = new Message();
    message1.content = 'me.jpg';
    await connection.manager.save(message1);

    const message2 = new Message();
    message2.content = 'me-and-bears.jpg';
    await connection.manager.save(message2);

    const userRepository = connection.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: 1 },
      relations: ['workspaces'],
    });

    (user as User).messages = [message1, message2];
    await connection.manager.save(user);

    // eslint-disable-next-line no-console
    console.log('user: ', user);
    */

    /* user.workspaces
    *  workspace.members
    *
    const userRepository = connection.getRepository(User);
    const users = await userRepository.findOne({
      where: { id: 1 },
      relations: ['workspaces'],
    });

    const workspacesRepository = connection.getRepository(Workspace);
    const workspaces = await workspacesRepository.findOne({
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
    */
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error while connecting to the database', error);
  }

  // eslint-disable-next-line no-console
  console.log('Connection to the db established.');

  const app = new App([new DummyController()]);

  app.listen();
})();
