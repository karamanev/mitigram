/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testRegex: '\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@angular/core$': '<rootDir>/src/__mocks__/angular-core.ts',
    '^@angular/common/http$': '<rootDir>/src/__mocks__/angular-common-http.ts',
    '^@mitigram/shared$': '<rootDir>/src/shared/index.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
