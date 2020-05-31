import redis, { RedisClient } from 'redis';

const createRedisClient = () => {
  let redisClient: RedisClient;
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    redisClient = redis.createClient(process.env.REDIS_URL);
  } else {
    // use localhost in development
    redisClient = redis.createClient({
      auth_pass: 'ben',
    });
  }

  redisClient.on('ready', () => {
    // eslint-disable-next-line
    console.log('Redis Client is ready');
  });

  redisClient.on('connect', () => {
    // eslint-disable-next-line
    console.log('Redis Client has connected');
  });

  redisClient.on('end', () => {
    // eslint-disable-next-line
    console.log('Redis Client has closed the connection');
  });

  // log error
  redisClient.on('error', error => {
    // eslint-disable-next-line
    console.log('createRedisClient error: ', error);
  });

  return redisClient;
};

export default createRedisClient;
