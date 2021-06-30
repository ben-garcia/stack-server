import connectRedis from 'connect-redis';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import Redis from 'ioredis';
import socketio from 'socket.io';

import { addTestRoutes } from './utils';
import { Controller } from './controllers/types';
import { UserConnected } from './types';

const RedisStore = connectRedis(session);

class App {
  public app: Application;
  private server: http.Server;
  private io: socketio.Server;
  // users with be store as:
  // socketIO will map to tuple containing
  // username,
  // workspaceName(which is string in the form `${workspace.id}:${workspaceanme}`)
  // channelName(which is either channel or teammate)
  private users: Map<string, [string, string, string]>;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.users = new Map();

    this.initializeMiddleware();
    this.initializeControllers(controllers);
  }

  private initializeSocketIO(): void {
    this.io = socketio(this.server, {
      origins: process.env.CLIENT_URL ?? 'http://localhost:3000',
    });
    this.io.on('connection', (socket: socketio.Socket) => {
      socket.on(
        'user-connected',
        ({ channelName, username, workspaceName }: UserConnected) => {
          // keep track of newly connected user
          // channel/teammate channel they're in
          // username,
          // along with the workspace name,
          this.users.set(socket.id, [username, workspaceName, channelName]);
          // this room will be used to emit when a user connects/disconnects
          socket.join(workspaceName, (err: any) => {
            if (err) {
              // eslint-disable-next-line
              console.log(`couldn't join room ${workspaceName}: `, err);
            }
            // keep track of the usernames that belong to the same room
            const usernames: string[] = [];
            // list of socket ids connect to the room
            const socketIds = socket.to(workspaceName).adapter.sids;
            // parse socketIds
            const parsedSocketIds = JSON.parse(JSON.stringify(socketIds));
            // get the values which is another object containing socket id
            // and room name(which indicates that the socket is in a particular room)
            Object.values(parsedSocketIds).forEach((obj: any) => {
              // get the key of each individual object
              const keys = Object.keys(obj);
              // when the socket is part of the room in question then add
              // the username to send to the client
              if (obj[workspaceName]) {
                const user = this.users.get(keys[0]);
                if (user) {
                  usernames.push(user[0]);
                }
              }
            });
            // send to all connected to the room, including sender
            // the list of the users who are in the same workspace
            this.io.in(workspaceName).emit('user-connected', {
              usernames,
            });
          });
          // this room is either a channel(where the user is a member of) or
          // a way to communicate with a single teammate
          socket.join(channelName, (err: any) => {
            if (err) {
              // eslint-disable-next-line
              console.log(`couldn't join room ${channelName}: `, err);
            }
          });
        }
      );
      socket.on('channel-message', (message: string) => {
        const user = this.users.get(socket.id);
        if (user) {
          // send message to all connected to the channel including sender
          this.io.in(user[2]).emit('channel-message', message);
        }
      });
      socket.on('direct-message', (message: string) => {
        const user = this.users.get(socket.id);
        if (user) {
          // send message to all connected to the channel including sender
          this.io.in(user[2]).emit('direct-message', message);
        }
      });
      socket.on('user-disconnected', (username: string) => {
        const user = this.users.get(socket.id);
        if (user) {
          // send the username of the user that has disconnected
          socket.in(user[1]).emit('user-disconnected', username);
        }
        // leave both channels
        socket.leaveAll();
      });
      socket.on('disconnect', () => {
        const user = this.users.get(socket.id);
        if (user) {
          // send the username of the user that has disconnected
          socket.in(user[1]).emit('user-disconnected', user[0]);
        }
        // remove the user from users map
        this.users.delete(socket.id);
        // leave both channels
        socket.leaveAll();
      });
    });
  }

  // wrapper method for the listen method in express
  public listen(): void {
    const port = process.env.PORT || 8080;

    this.initializeSocketIO();

    this.server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Listening on port ${port}`);
    });
  }

  // add the middlewares for the application.
  private initializeMiddleware(): void {
    let redisClient: Redis.Redis;

    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      redisClient = new Redis(
        // after upgrading Heroku Redis from 5 to 6
        // @see https://devcenter.heroku.com/articles/heroku-redis-hobby-deprecation#updates-to-your-add-on-configuration
        process.env.REDIS_URL
        /*
        {
          // skip certificate verification
          // @see https://devcenter.heroku.com/articles/heroku-redis
          tls: {
            rejectUnauthorized: false,
          },
        }
				*/
      );
    } else {
      // use localhost in development
      redisClient = new Redis({ password: 'ben' });
    }

    this.app.use(express.json()); // parse application/json in req.body
    this.app.use(morgan('dev')); // logger
    this.app.use(helmet()); // sets up various HTTP headers for security
    this.app.use(
      cors({
        credentials: true, // pass the 'Cookie' header
        methods: ['GET', 'OPTIONS', 'POST', 'PUT'], // supported http methods
        origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
      })
    ); // enable cors
    // session + cookie information
    this.app.use(
      session({
        cookie: {
          httpOnly: true, // default
          maxAge: 1000 * 60 * 60 * 24 * 30, // 1 month
          // send the cookie with every request reguardless of URL.
          path: '/',
          sameSite: 'none',
          secure: process.env.NODE_ENV === 'production', // set in production
        },
        name: 'stackSessionId', // name for the session id cookie
        // proxy: true, // save session cookie id to client in Heroku
        resave: false, // only save the session if it was modified during request
        saveUninitialized: false, // for login session
        secret: process.env.REDIS_SECRET ?? 'keyboard_cat',
        store: new RedisStore({
          client: redisClient,
        }),
      })
    );
  }

  // add the routes found in the controllers to the app
  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach(controller => {
      this.app.use(`/api${controller.path}`, controller.router);
    });

    if (process.env.NODE_ENV === 'development') {
      // add routes for e2e tests
      addTestRoutes(this.app);
    }

    // catch undefined endpoints
    this.app.use((req: Request, res: Response) => {
      const { url, method } = req;
      res
        .status(404)
        .json({ error: `'${method}' request to '${url}' doesn't exists` });
    });
  }
}

export default App;
