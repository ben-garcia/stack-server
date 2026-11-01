import { DataSource, DataSourceOptions } from 'typeorm';

import { User, Channel, DirectMessage, Message, Workspace } from '../entity';

const getDataSourceOptions = (): DataSourceOptions => {
  if (process.env.NODE_ENV === 'production') {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Heroku requirement
      },
      entities: [User, Channel, DirectMessage, Message, Workspace],
      synchronize: false, // typically false in production
    };
  }

  return {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres', // adjust to your local dev credentials
    password: '',
    database: 'stack_development',
    entities: [User, Channel, DirectMessage, Message, Workspace],
    synchronize: true,
  };
};

export const AppDataSource = new DataSource(getDataSourceOptions());

export const createTypeormConnection = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};

export default createTypeormConnection;
