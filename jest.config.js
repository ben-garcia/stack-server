module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/*.test.ts', '**/?(*.)+(test).+(ts)'],
  transform: {
    '^.+\\.(ts)?$': 'ts-jest',
  },
};
