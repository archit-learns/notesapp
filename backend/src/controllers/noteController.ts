import { Request, Response } from 'express';
import { NoteService } from '../services/noteService';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { reminderQueue } from '../config/queue';

export class NoteController {
  private noteService = new NoteService();

  create = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
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

  delete = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
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
    getAll = async (req: AuthenticatedRequest, res: Response) => {
    const rawUserId = req.userId;
    if (!rawUserId) return res.status(401).json({ error: 'Unauthorized' });
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    try {
        const notes = await this.noteService.getAllNotes(userId);
        return res.json(notes);
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
    const rawUserId = req.userId;
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

    scheduleReminder = async (req: AuthenticatedRequest, res: Response) => {
        const { noteId, message, delayInSeconds, repeatEverySeconds } = req.body;

        try {
        let jobOptions: any = {};

        // Strategy A: If it's a delayed one-time alarm
        if (delayInSeconds) {
            jobOptions.delay = delayInSeconds * 1000; // BullMQ operates in milliseconds
        }

        // Strategy B: If it's a cron-like repeating alarm (every x seconds/minutes)
        if (repeatEverySeconds) {
            jobOptions.repeat = {
            every: repeatEverySeconds * 1000,
            };
        }

        // Push the job payload directly into the Redis queue!
        const job = await reminderQueue.add(
            'send-reminder',
            { noteId, message },
            jobOptions
        );

        return res.json({
            success: true,
            message: 'Alarm scheduled beautifully!',
            jobId: job.id,
        });
        } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to schedule reminder' });
        }
    };

stopReminder = async (req: AuthenticatedRequest, res: Response) => {
    const { noteId } = req.body;

    try {
      // 1. Fetch all repeatable jobs currently registered inside our Redis queue
      const repeatableJobs = await reminderQueue.getRepeatableJobs();

      // 2. Find the specific job that matches this noteId
      // BullMQ names repeating jobs using a strict pattern, or we can look inside the metadata
      const targetJob = repeatableJobs.find(job => job.id?.includes(noteId) || job.name.includes(noteId));

      if (!targetJob) {
        return res.status(404).json({ error: 'No active repeating alarm found for this note.' });
      }

      // 3. Command Redis to completely delete the schedule using its internal Repeat Key
      await reminderQueue.removeRepeatableByKey(targetJob.key);

      return res.json({
        success: true,
        message: 'Alarm stopped and scrubbed from Redis completely!'
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to stop the reminder' });
    }
  };

}