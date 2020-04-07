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

  constructor(controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);

    this.initializeMiddleware();
    this.initializeControllers(controllers);
  }

  // wrapper method for the listen method in express
  public listen(): void {
    const port = process.env.PORT || 8080;

    this.io = socketio(this.server);
    this.io.of('/namespace').on('connection', (socket: socketio.Socket) => {
      // eslint-disable-next-line
      console.log('----------------- connected -------------');
      socket.emit('test', { message: 'testing' });
      socket.on('disconnect', () => {
        // eslint-disable-next-line
        console.log('----------------- disconnected -------------');
      });
    });

    // this.app.set('socketio', this.io);

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
