import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import stylisticLint from '@stylistic/eslint-plugin';


export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } }
  },
  {
    ignores: ['dist/**/*']
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylisticLint.configs['recommended-flat'],
  eslintPluginUnicorn.configs['flat/recommended'],
  {
    rules: {
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/comma-dangle': 'off',
      '@stylistic/implicit-arrow-linebreak': 'error',
      '@stylistic/max-len': ['error', {
        code: 200,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreUrls: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: false }
      }],
      '@stylistic/no-confusing-arrow': 'error',
      '@stylistic/no-mixed-operators': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 2 }],
      '@stylistic/nonblock-statement-body-position': 'error',
      '@stylistic/object-curly-newline': 'error',
      '@stylistic/operator-linebreak': ['error', 'before', { overrides: { '=': 'none' } }],
      '@stylistic/padded-blocks': 'off',
      '@stylistic/semi': ['error', 'always'],
      '@typescript-eslint/no-use-before-define': 'error',
      'array-callback-return': 'error',
      'arrow-body-style': 'error',
      'camelcase': ['error', { properties: 'always', allow: ['_id', '_type'] }],
      'class-methods-use-this': 'error',
      'default-param-last': 'error',
      'dot-notation': 'error',
      'eqeqeq': 'error',
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'function-paren-newline': 'error',
      'new-cap': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'error',
      'no-eval': 'error',
      'no-loop-func': 'error',
      'no-new-func': 'error',
      'no-object-constructor': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-plusplus': 'error',
      'no-useless-constructor': 'error',
      'object-shorthand': ['error', 'always', { avoidExplicitReturnArrows: true }],
      'one-var': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['error', { array: true, object: true }],
      'prefer-exponentiation-operator': 'error',
      'prefer-object-spread': 'error',
      'prefer-template': 'error',
      'radix': 'error',
      'unicorn/filename-case': ['warn', { case: 'camelCase' }],
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': ['error', {
        replacements: {
          arr: false,
          obj: false,
          val: false,
          i: false,
          j: false
        }
      }]
    }
  }
];
