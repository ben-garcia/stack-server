import 'express-session';

// This empty export forces TypeScript to treat this file as an ES module,
// which is required for proper module augmentation (declaration merging).
export {};

declare module 'express-session' {
  interface SessionData {
    userId: string | number;
    username: string;
  }
}
