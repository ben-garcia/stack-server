import express, { Application } from 'express';
import morgan from 'morgan';

import { Controller } from './controllers/types';

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
  }

  // add the routes found in the controllers to the app
  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach(controller => {
      this.app.use('/', controller.router);
    });
  }
}

export default App;
