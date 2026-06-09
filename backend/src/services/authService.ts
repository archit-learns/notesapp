import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';

const JWT_SECRET = 'super-secret-key-that-nobody-can-guess';

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

    // Sign a token for immediate use after signup
    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '1h' });

    return { userId: id, token };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error('INVALID_CREDENTIALS');

    // 2. Generate the signed token holding the user's ID
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    return { userId: user.id, email: user.email, token };
  }
}