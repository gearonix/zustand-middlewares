const { presets, configure } = require('eslint-kit')

module.exports = configure({
  root: __dirname,
  presets: [
    presets.imports({}),
    presets.typescript({ tsconfig: 'tsconfig.json', root: __dirname }),
    presets.prettier({
      singleQuote: true,
      trailingComma: 'none',
      endOfLine: 'auto',
      semi: false
    }),
    presets.node({})
  ],
  extend: {
    ignorePatterns: ['*.yaml', '*.json', '.eslintrc.cjs', 'dist', '*.md'],
    rules: {
      'import/extensions': 'error'
    }
  }
})
