module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.+(ts)', '**/?(*.)+(test).+(ts)'],
  transform: {
    '^.+\\.(ts)?$': 'ts-jest',
  },
};
