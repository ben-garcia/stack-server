module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts)', '**/?(*.)+(test).+(ts)'],
  transform: {
    '^.+\\.(ts)?$': 'ts-jest',
  },
};
