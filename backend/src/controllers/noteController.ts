import { Request, Response } from 'express';
import { NoteService } from '../services/noteService';

export class NoteController {
  private noteService = new NoteService();

  create = async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { id, title, content, createdAt } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await this.noteService.createNote(id, userId, title, content, createdAt);
      return res.status(201).json(req.body);
    } catch (err: any) {
      // Translate internal system errors into HTTP status codes
      if (err.message.startsWith('VALIDATION')) return res.status(400).json({ error: err.message });
      if (err.message === 'BUSINESS_LIMIT_REACHED') return res.status(403).json({ error: err.message });
      
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  delete = async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await this.noteService.deleteNote(noteId, userId);
      return res.json({ success: true });
    } catch (err: any) {
      if (err.message === 'NOT_AUTHORIZED') return res.status(403).json({ error: 'Forbidden' });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };


    // Add inside the NoteController class
    getAll = async (req: Request, res: Response) => {
    const rawUserId = req.headers['x-user-id'];
    if (!rawUserId) return res.status(401).json({ error: 'Unauthorized' });
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    try {
        const notes = await this.noteService.getAllNotes(userId);
        return res.json(notes);
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    };

    update = async (req: Request, res: Response) => {
    const rawUserId = req.headers['x-user-id'];
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, content } = req.body;

    if (!rawUserId) return res.status(401).json({ error: 'Unauthorized' });
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    try {
        const updatedNote = await this.noteService.updateNote(noteId, userId, title, content);
        return res.json(updatedNote);
    } catch (err: any) {
        if (err.message === 'NOT_AUTHORIZED') return res.status(403).json({ error: 'Forbidden' });
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    };

}