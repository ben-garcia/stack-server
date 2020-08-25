import { Application, Request, Response } from 'express';
import { getRepository } from 'typeorm';

import { Channel, DirectMessage, Message, User, Workspace } from '../entity';

/**
 * Creates routes to add a resource and a route to clear the db.
 *
 * Used for e2e testing
 *
 */
const addTestRoutes = (app: Application) => {
  app.post('/tests/channels', async (req: Request, res: Response) => {
    const channel = (getRepository<Channel>(Channel).create(
      req.body
    ) as any).save();
    res.json(channel);
  });

  app.post('/tests/direct-messages', async (req: Request, res: Response) => {
    const directMessage = (getRepository<DirectMessage>(DirectMessage).create(
      req.body
    ) as any).save();
    res.json(directMessage);
  });

  app.post('/tests/messages', async (req: Request, res: Response) => {
    const message = (getRepository<Message>(Message).create(
      req.body
    ) as any).save();
    res.json(message);
  });

  app.post('/tests/users', async (req: Request, res: Response) => {
    const user = (getRepository<User>(User).create(req.body) as any).save();
    res.json(user);
  });

  app.post('/tests/workspaces', async (req: Request, res: Response) => {
    const workspace = (getRepository<Workspace>(Workspace).create(
      req.body
    ) as any).save();
    res.json(workspace);
  });

  app.post('/tests/clear', async (_: Request, res: Response) => {
    await getRepository<Message>(Message).query('DELETE FROM messages');
    await getRepository<DirectMessage>(DirectMessage).query(
      'DELETE FROM direct_messages'
    );
    await getRepository<Channel>(Channel).query('DELETE FROM channels');
    await getRepository<Workspace>(Workspace).query('DELETE FROM workspaces');
    await getRepository<User>(User).query('DELETE FROM users');

    res.json({});
  });
};

export default addTestRoutes;
