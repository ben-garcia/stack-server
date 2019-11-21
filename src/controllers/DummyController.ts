import express, { Request, Response, Router } from 'express';

import { Controller } from './types';

class DummyController implements Controller {
  public router: Router;
  private endpoint: string = '/dummy';
  private response: string = 'Hello World';

  constructor() {
    this.router = express.Router();

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.endpoint, this.sendResponse);
  }

  private sendResponse(req: Request, res: Response) {
    res.send({
      url: req.url,
      method: req.method,
      response: this.response,
    });
  }
}

export default DummyController;
