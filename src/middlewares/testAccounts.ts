import { Request, Response, NextFunction } from 'express';

/**
 * Prevents test accnounts from saving to the db.
 */
const checkForTestAccounts = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const method = req.method.toUpperCase();
  // check if a testing user is requesting 'POST' || 'PUT',
  // if they are then send error message
  // and prevent the request from moving up the chain
  if (
    (method === 'POST' || method === 'PUT') &&
    (req.session!.username === 'stackguest' ||
      req.session!.username === 'stacktestuser')
  ) {
    res.status(403).json({ error: 'Resource cannot be modified nor created' });
  } else {
    next();
  }
};

export default checkForTestAccounts;
