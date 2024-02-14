module.exports = {
  ...require('@grnx-utils/eslint')({
    enableImports: false,
    ext: {
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'error'
    },
    ignore: ['*.yaml', 'LICENSE', '.gitignore', '*.md', 'preview', '*.json'],
    root: __dirname
  })
}
