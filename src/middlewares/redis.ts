import { Request, Response, NextFunction } from 'express';
import redis from 'redis';

const client = redis.createClient({
  auth_pass: 'ben',
});

/**
 * Checks if the request resource is stored in Redis
 */
const checkRedis = (req: Request, res: Response, next: NextFunction) => {
  // requested resource
  const resourceName = req.baseUrl.split('/')[2];
  // having passed the userSession middleware
  const { userId, username } = req.session!;
  const redisKey = `user:${userId}-${username}:${resourceName}`;

  client.exists(redisKey, (err, result) => {
    // check for an error
    if (err) {
      // eslint-disable-next-line
      console.log('err inside client.exists: ', err);
    }
    if (result) {
      client.get(redisKey, (error, resource) => {
        if (error) {
          // eslint-disable-next-line
          console.log('err inside client.get: ', error);
        }
        // when the resource exists in Redis then
        // return it to the client without the need
        // to query the db
        res.status(200).json({ [`${resourceName}`]: JSON.parse(resource) });
      });
    } else {
      // for when the resource inn't in Redis then
      // move the chain forward
      next();
    }
  });
};

export default checkRedis;
