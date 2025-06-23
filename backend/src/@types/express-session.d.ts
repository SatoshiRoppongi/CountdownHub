import 'express-session';

declare global {
  namespace Express {
    interface Request {
      sessionID?: string;
      session?: any;
    }
  }
}

export {};