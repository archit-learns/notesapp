import express from 'express';
import cors from 'cors';
import { NoteController } from './controllers/noteController';
import { AuthController } from './controllers/authController';
import { authenticateToken } from './middlewares/auth.middleware';

const app = express();
app.use(cors());
app.use(express.json());

const noteController = new NoteController();
const authController = new AuthController();

// Auth Domain Routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);

// Notes Domain Routes
app.get('/api/notes', authenticateToken, noteController.getAll);
app.post('/api/notes', authenticateToken, noteController.create);
app.post('/api/notes/reminder', authenticateToken, noteController.scheduleReminder);
app.post('/api/notes/reminder/stop', authenticateToken, noteController.stopReminder);
app.put('/api/notes/:id', authenticateToken, noteController.update);
app.delete('/api/notes/:id', authenticateToken, noteController.delete);

export default app;