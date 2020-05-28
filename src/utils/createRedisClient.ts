import redis from 'redis';

const createRedisClient = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return redis.createClient(process.env.REDIS_URL!);
  }

  return redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    auth_pass: 'ben',
  });
};

export default createRedisClient;
