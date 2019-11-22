import App from './App';
import DummyController from './controllers/DummyController';

const app = new App([new DummyController()]);

app.listen();
