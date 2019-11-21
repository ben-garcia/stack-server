import express, { Request, Response, Router } from 'express';

import { Controller } from './types';

class DummyController implements Controller {
  public router: Router;
  private endpoint: string = '/dummy';

  constructor() {
    this.router = express.Router();

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.endpoint, this.sendResponse);
  }

  private sendResponse(req: Request, res: Response) {
    res.json({
      url: req.url,
      method: req.method,
      response: 'Hello World',
    });
  }
}

export default DummyController;
