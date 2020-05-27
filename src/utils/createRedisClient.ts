import redis from 'redis';

const createRedisClient = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let redisOptions;
  if (isProduction) {
    redisOptions = { url: process.env.REDIS_URL };
  } else {
    redisOptions = { host: '127.0.0.1', port: 6379, auth_pass: 'ben' };
  }

  return redis.createClient(redisOptions);
};

export default createRedisClient;
