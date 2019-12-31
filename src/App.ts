import express, { Application } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import redis from 'redis';
import connectRedis from 'connect-redis';

import { Controller } from './controllers/types';

const RedisStore = connectRedis(session);
const redisClient = redis.createClient(6379, '127.0.0.1');

redisClient.auth('ben');

class App {
  private app: Application;

  constructor(controllers: Controller[]) {
    this.app = express();

    this.initializeMiddleware();
    this.initializeControllers(controllers);
  }

  // wrapper method for the listen method in express
  public listen(): void {
    const port = process.env.PORT || 8080;

    this.app.listen(port, () => {
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
