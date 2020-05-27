import {
  createConnection,
  ConnectionOptions,
  getConnectionOptions,
} from 'typeorm';

export const createTypeormConnection = async () => {
  const connectionOptions: ConnectionOptions = await getConnectionOptions(
    process.env.NODE_ENV
  );
  const isProduction: boolean = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return createConnection({
      ...connectionOptions,
      name: 'default',
      extra: {
        url: process.env.DATABASE_URL,
      },
    });
  }
  return createConnection({ ...connectionOptions, name: 'default' });
};

export default createTypeormConnection;
