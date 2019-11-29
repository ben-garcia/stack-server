import bcrypt from 'bcrypt';

import User from '../User';

describe('User entity', () => {
  bcrypt.hash = jest.fn();

  it('should hash the password by calling hashPassword method', async () => {
    const user: User = new User();
    const initialPassword = 'testing';

    user.email = 'test@test.com';
    user.username = 'testing';
    user.password = initialPassword;

    await user.hashPassword();

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(user.password).not.toBe(initialPassword);
  });
});
