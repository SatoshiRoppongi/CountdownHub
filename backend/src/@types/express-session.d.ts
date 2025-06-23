import 'express-session';
import { Session } from 'express-session';

declare module 'express' {
  interface Request {
    sessionID?: string;
    session?: Session & Partial<any>;
  }
}

export {};