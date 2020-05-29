import redis, { RedisClient } from 'redis';
import url from 'url';

const createRedisClient = () => {
  let client: RedisClient;
  if (process.env.REDIS_URL) {
    const parsedUrl = url.parse(process.env.REDIS_URL);
    const password = parsedUrl.auth?.split(':')[1];
    client = redis.createClient({
      host: parsedUrl.host!,
      password,
      port: Number(parsedUrl.port),
    });
  } else {
    // use localhost on development
    client = redis.createClient({
      host: '127.0.0.11',
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
