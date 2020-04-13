import connectRedis from 'connect-redis';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import http from 'http';
import socketio from 'socket.io';
import morgan from 'morgan';
import redis from 'redis';
import session from 'express-session';

import { Controller } from './controllers/types';

const RedisStore = connectRedis(session);
const redisClient = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
  auth_pass: 'ben',
});

class App {
  private app: Application;
  private server: http.Server;
  private io: socketio.Server;
  private users: Map<string, string>;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.users = new Map();

    this.initializeMiddleware();
    this.initializeControllers(controllers);
  }

  private initializeSocketIO(): void {
    this.io = socketio(this.server);
    this.io.on('connection', (socket: socketio.Socket) => {
      // eslint-disable-next-line
      console.log('----------------- connected -------------');
      socket.on('user-connected', ({ username, channelName }) => {
        this.users.set(socket.id, username);
        // eslint-disable-next-line
        socket.join(channelName, (err: any) => {
          if (err) {
            // eslint-disable-next-line
            console.log(`couldn't join room ${channelName}: `, err);
          }

          // keep track of the usernames that belong to the same room
          const usernames: any = [];
          // list of socket ids connect to the room
          const socketIds = socket.to(channelName).adapter.sids;
          // parse socketIds
          const parsedSocketIds = JSON.parse(JSON.stringify(socketIds));
          // get the values which is another object containing socket id
          // and room name(which indicates that the socket is in a particular room)
          Object.values(parsedSocketIds).forEach((obj: any) => {
            // get the key of each individual object
            const keys = Object.keys(obj);
            // when the socket is part of the room in question then add
            // the username to send to the client
            if (obj[channelName]) {
              usernames.push(this.users.get(keys[0]));
            }
          });

          // send to all connected, to the room, including sender
          this.io.in(channelName).emit('user-connected', {
            usernames,
          });
        });
      });
      socket.on('channel-message', message => {
        const { channelName } = JSON.parse(message);
        // eslint-disable-next-line
        console.log(`----------------${channelName}-----------`);
        socket.to(channelName).broadcast.emit('channel-message', message);
      });
      socket.on('direct-message', message => {
        const { channelName } = JSON.parse(message);
        socket.to(channelName).broadcast.emit('direct-message', message);
      });
      socket.on('disconnect', () => {
        // eslint-disable-next-line
        console.log('----------------- disconnected -------------');
        const { rooms } = socket.adapter;
        const channelName = Object.keys(rooms)[0];
        socket
          .to(channelName)
          .emit('user-disconnected', this.users.get(socket.id));
        // remove from the users map
        this.users.delete(socket.id);
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
    this.app.use(express.json()); // parse application/json in req.body
    this.app.use(morgan('dev')); // logger
    this.app.use(helmet()); // sets up various HTTP headers for security
    this.app.use(cors()); // enable cors
    this.app.use(
      session({
        name: 'stackId',
        resave: false,
        saveUninitialized: false,
        secret: 'keyboard_cat', // TODO: move to .env
        store: new RedisStore({ client: redisClient }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
          secure: process.env.NODE_ENV === 'production',
        },
      })
    ); // session + cookie information
  }

  // add the routes found in the controllers to the app
  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach(controller => {
      this.app.use(controller.path, controller.router);
    });
  }
}

export default App;
