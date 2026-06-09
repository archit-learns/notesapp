import { NoteRepository } from '../repositories/note.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { redisClient } from '../config/redis';

export class NoteService {
  private noteRepo = new NoteRepository();
  private auditRepo = new AuditRepository();

  async createNote(id: string, userId: string, title: string, content: string, createdAt: string) {
    // 1. Enforce Validation
    if (!title || title.trim().length === 0) throw new Error('VALIDATION_EMPTY_TITLE');
    if (title.length > 100) throw new Error('VALIDATION_TITLE_TOO_LONG');
    if (content.length > 10000) throw new Error('VALIDATION_CONTENT_TOO_LONG');

    // 2. Enforce Freemium Cap
    const totalNotes = await this.noteRepo.countByUserId(userId);
    if (totalNotes >= 5) throw new Error('BUSINESS_LIMIT_REACHED');

    // 3. Persist
    await this.noteRepo.create(id, userId, title, content, createdAt);

    // 4. Side Effect
    await this.auditRepo.logAction(userId, 'CREATE', id);

    await redisClient.del(`user:${userId}:notes`);
    console.log('🧹 CACHE EVICTED: Cleared out stale data after note creation.');
  }

  async deleteNote(noteId: string, userId: string) {
    const isOwner = await this.noteRepo.checkOwnership(noteId, userId);
    if (!isOwner) throw new Error('NOT_AUTHORIZED');

    await this.noteRepo.delete(noteId);
    await this.auditRepo.logAction(userId, 'DELETE', noteId);

    await redisClient.del(`user:${userId}:notes`);
    console.log('🧹 CACHE EVICTED: Cleared out stale data after note deletion.');
  }

// Add inside the NoteService class
async getAllNotes(userId: string) {

  const cacheKey = `user:${userId}:notes`;

  try{
    const cachedNotes = await redisClient.get(cacheKey);
    if (cachedNotes) {
            console.log('⚡ CACHE HIT: Fetching notes directly from Redis RAM!');
            return JSON.parse(cachedNotes);
        }
  }
  catch(err){
    console.error('Cache retrieval error:', err);
  }

// 2. CACHE MISS: Go to PostgreSQL (Disk)
    console.log('🐌 CACHE MISS: Hitting PostgreSQL Disk storage...');
    const rows = await this.noteRepo.findAllByUserId(userId);
    const formattedNotes = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at
    }));

    try {
      // 3. Save a copy into Redis for next time. 
      // EX: 300 sets a Time-To-Live (TTL) of 5 minutes so RAM cleans itself up automatically.
      await redisClient.setEx(cacheKey, 300, JSON.stringify(formattedNotes));
    } catch (cacheErr) {
      console.error('Failed to save to Redis cache:', cacheErr);
    }

    return formattedNotes;
}

async updateNote(noteId: string, userId: string, title: string, content: string) {
  const isOwner = await this.noteRepo.checkOwnership(noteId, userId);
  if (!isOwner) throw new Error('NOT_AUTHORIZED');

  const updatedRow = await this.noteRepo.update(noteId, title, content);
  await this.auditRepo.logAction(userId, 'UPDATE', noteId);

    await redisClient.del(`user:${userId}:notes`);
    console.log('🧹 CACHE EVICTED: Cleared out stale data after note edit.');

  return {
    id: updatedRow.id,
    title: updatedRow.title,
    content: updatedRow.content,
    createdAt: updatedRow.created_at
  };
}

}