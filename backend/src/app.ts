import express from 'express';
import cors from 'cors';
import { NoteController } from './controllers/noteController';
import { AuthController } from './controllers/authController';

const app = express();
app.use(cors());
app.use(express.json());

const noteController = new NoteController();
const authController = new AuthController();

// Auth Domain Routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);

// Notes Domain Routes
app.get('/api/notes', noteController.getAll);
app.post('/api/notes', noteController.create);
app.put('/api/notes/:id', noteController.update);
app.delete('/api/notes/:id', noteController.delete);

export default app;