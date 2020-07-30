const fakeUserBase = {
  email: 'fakeuser@email.com',
  username: 'fakeuser',
  password: 'bestpassword',
};
const fakeUserWithInvalidEmail = {
  ...fakeUserBase,
  email: 'invalidemail',
};
const fakeUserWithInvalidUsername = {
  ...fakeUserBase,
  username: 'user',
};
const fakeUserWithInvalidPassword = {
  ...fakeUserBase,
  password: 'pass',
};
const fakeUserWithSameEmail = {
  ...fakeUserBase,
  username: 'fakeuserwithsameemail',
};
const fakeUserWithSameUsername = {
  ...fakeUserBase,
  email: 'sameusername@email.com',
};
const fakeUserTryingToLoginWithInvalidEmail = {
  ...fakeUserBase,
  email: 'noemailfound@email.com',
};
const fakeUserTryingToLoginWithInvalidPassword = {
  ...fakeUserBase,
  password: 'wrongpassword',
};

const fakeUser = {
  base: fakeUserBase,
  withInvalidEmail: fakeUserWithInvalidEmail,
  withInvalidUsername: fakeUserWithInvalidUsername,
  withInvalidPassword: fakeUserWithInvalidPassword,
  withSameEmail: fakeUserWithSameEmail,
  withSameUsername: fakeUserWithSameUsername,
  tryingToLoginWithInvalidEmail: fakeUserTryingToLoginWithInvalidEmail,
  tryingToLoginWithInvalidPassword: fakeUserTryingToLoginWithInvalidPassword,
};

// eslint-disable-next-line import/prefer-default-export
export { fakeUser };
