module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all'
  ],
  plugins: [],
  env: {
    node: true,
  },
  rules: {
    'jest/no-hooks': [
      'error',
      {
        'allow': ['afterAll', 'afterEach', 'beforeAll', 'beforeEach']
      }
    ],
    'jest/no-test-callback': 0,
    'no-console': 0,
    'no-param-reassign': 0,
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          '.eslint-bin/*.js',
          'test/**/*.js'
        ]
      }
    ]
  },
};
