import { NoteRepository } from '../repositories/note.repository';
import { AuditRepository } from '../repositories/audit.repository';

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
  }

  async deleteNote(noteId: string, userId: string) {
    const isOwner = await this.noteRepo.checkOwnership(noteId, userId);
    if (!isOwner) throw new Error('NOT_AUTHORIZED');

    await this.noteRepo.delete(noteId);
    await this.auditRepo.logAction(userId, 'DELETE', noteId);
  }

// Add inside the NoteService class
async getAllNotes(userId: string) {
  const rows = await this.noteRepo.findAllByUserId(userId);
  // Map internal database names back to what the system/frontend expects
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at
  }));
}

async updateNote(noteId: string, userId: string, title: string, content: string) {
  const isOwner = await this.noteRepo.checkOwnership(noteId, userId);
  if (!isOwner) throw new Error('NOT_AUTHORIZED');

  const updatedRow = await this.noteRepo.update(noteId, title, content);
  await this.auditRepo.logAction(userId, 'UPDATE', noteId);

  return {
    id: updatedRow.id,
    title: updatedRow.title,
    content: updatedRow.content,
    createdAt: updatedRow.created_at
  };
}

}