import express, { Application } from 'express';

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
    this.app.listen(process.env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Listening on port ${process.env.PORT}`);
    });
  }

  // add the middlewares for the application.
  private initializeMiddleware(): void {
    this.app.use(express.json()); // parse application/json in req.body
  }

  // add the routes found in the controllers to the app
  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach(controller => {
      this.app.use('/', controller.router);
    });
  }
}

export default App;
