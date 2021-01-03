const tailwind = require('./tailwind.config.js')
const purgecss = require('@fullhuman/postcss-purgecss')({
  content: ['./**/**/*.html', './**/**/*.svelte'],
  whitelistPatterns: [/svelte-/],
  defaultExtractor: content => {
    const regExp = new RegExp(/[\w-/:]+(?<!:)/g)
    const matchedTokens = []
    let match = regExp.exec(content)
    while (match) {
      (match[0].startsWith('class:') ? matchedTokens.push(match[0].substring(6)) : matchedTokens.push(match[0]))
      match = regExp.exec(content)
    }
    return matchedTokens
  }
})

const production = process.env.NODE_ENV !== 'development'

module.exports = {
  plugins: [
    // require('postcss-import'),
    // require('postcss-url')(),
    require('tailwindcss')(tailwind),
    ...(production ? [require('cssnano')(), purgecss] : [])
  ]
}
