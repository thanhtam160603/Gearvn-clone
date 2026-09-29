import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

@Injectable()
export class PasswordService {
  hash(value: string): Promise<string> {
    return bcrypt.hash(value, BCRYPT_COST);
  }

  verify(hash: string, value: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
