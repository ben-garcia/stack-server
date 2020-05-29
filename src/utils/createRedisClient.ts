import redis, { RedisClient } from 'redis';

const createRedisClient = () => {
  let client: RedisClient;
  if (process.env.REDIS_URL) {
    client = redis.createClient(process.env.REDIS_URL);
  } else {
    // use localhost on development
    client = redis.createClient({
      host: '127.0.0.1',
      port: 6379,
      auth_pass: 'ben',
    });
  }

  // log error
  client.on('error', error => {
    // eslint-disable-next-line
    console.error('createRedisClient error: ', error);
  });

  return client;
};

export default createRedisClient;
