import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';

export class AuthService {
  private userRepo = new UserRepository();

  async signup(email: string, password: string) {
    if (!email || !password) throw new Error('MISSING_FIELDS');
    
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) throw new Error('EMAIL_EXISTS');

    const id = crypto.randomUUID();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await this.userRepo.create(id, email, passwordHash);
    return id;
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error('INVALID_CREDENTIALS');

    return { userId: user.id, email: user.email };
  }
}