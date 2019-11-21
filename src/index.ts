import App from './app';
import DummyController from './controllers/DummyController';

const app = new App([new DummyController()]);

app.listen();
