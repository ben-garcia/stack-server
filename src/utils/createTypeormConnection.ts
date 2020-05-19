import {
  createConnection,
  ConnectionOptions,
  getConnectionOptions,
} from 'typeorm';

export const createTypeormConnection = async () => {
  const connectionOptions: ConnectionOptions = await getConnectionOptions(
    process.env.NODE_ENV
  );
  return createConnection({ ...connectionOptions, name: 'default' });
};

export default createTypeormConnection;
