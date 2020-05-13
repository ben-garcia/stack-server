import { Request, Response, NextFunction } from 'express';

/**
 * Check that the session object exists on the req object
 */
const checkUserSession = (req: Request, res: Response, next: NextFunction) => {
  const { session } = req;

  // if there is no session
  // request shouldn't continue
  if (!session) {
    res.status(401).json({ message: 'Unauthorized' });
  }

  // given that the session object exists
  // move to the requeted endpoint
  next();
};

export default checkUserSession;
