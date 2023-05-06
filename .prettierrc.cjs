/**
 * @type {import('prettier').Options}
 */
module.exports = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: true,
  plugins: [require.resolve('@plasmohq/prettier-plugin-sort-imports')],
  importOrder: ['^@plasmohq/(.*)$', '^~(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
}
