import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class IdGenerator {
  static generate(): string {
    return uuidv4();
  }

  static generateShort(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  static generateNumeric(length = 12): string {
    if (length <= 0) return '';
    const max = Math.pow(10, length);
    const randomBytes = crypto.randomBytes(6);
    const randomInt = randomBytes.readUIntBE(0, 6) % max;
    return String(randomInt).padStart(length, '0');
  }
}
