import { Request, Response, NextFunction } from 'express';

/**
 * Check that the session object exists on the req object
 */
const checkUserSession = (req: Request, res: Response, next: NextFunction) => {
  const { session } = req;

  // if there is no session request shouldn't continue
  // if no userId then request doesn't include session cookie
  if (!session || !session.userId) {
    res.status(401).json({ message: 'Unauthorized' });
  } else {
    // given that the session object exists
    // move to the requeted endpoint
    next();
  }
};

export default checkUserSession;
