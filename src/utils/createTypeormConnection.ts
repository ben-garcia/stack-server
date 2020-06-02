import {
  createConnection,
  ConnectionOptions,
  getConnectionOptions,
} from 'typeorm';

export const createTypeormConnection = async () => {
  if (process.env.NODE_ENV === 'production') {
    // setup the correct env variable
    // that Heroku uses to the one that TypeORM uses
    process.env.TYPEORM_URL = process.env.DATABASE_URL;
    return createConnection();
  }

  // when not in production
  const connectionOptions: ConnectionOptions = await getConnectionOptions(
    process.env.NODE_ENV
  );
  return createConnection({ ...connectionOptions, name: 'default' });
};

export default createTypeormConnection;
