import redis, { RedisClient } from 'redis';

const createRedisClient = () => {
  // eslint-disable-next-line
  console.log('-----------------------------------');
  // eslint-disable-next-line
  console.log('REDIS_URL: ', process.env.REDIS_URL);
  // eslint-disable-next-line
  console.log('-----------------------------------');
  // if (process.env.REDIS_URL) {
  const client: RedisClient = redis.createClient(process.env.REDIS_URL!);
  // } else {
  // use localhost on development
  //    client = redis.createClient({
  //     host: '127.0.0.1',
  //    port: 6379,
  //   auth_pass: 'ben',
  // });
  // }

  // log error
  client.on('error', error => {
    // eslint-disable-next-line
    console.error('createRedisClient error: ', error);
  });

  return client;
};

export default createRedisClient;
