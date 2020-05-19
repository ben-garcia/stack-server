// This file is a collection of data used for integration testing
import { RegisterUser } from './types';

// eslint-disable-next-line
export const registerUser: RegisterUser = {
  email: 'email123@example.com',
  password: 'password',
  username: 'username',
};

export const registerUserWithInvalidUsername: RegisterUser = {
  email: 'email123@example.com',
  password: 'password',
  username: '12345',
};

export const registerUserWithInvalidPassword: RegisterUser = {
  email: 'email123@example.com',
  password: '12345',
  username: 'username2',
};

export const registerUserWithInvalidEmail: RegisterUser = {
  email: 'email123.com',
  password: 'password',
  username: 'username3',
};
