/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testRegex: '\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@angular/core$': '<rootDir>/src/__mocks__/angular-core.ts',
    '@mitigram/shared': '<rootDir>/../../packages/shared/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
