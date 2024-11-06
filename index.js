'use strict';

const htmlnano = require('htmlnano');
const { minify } = require('terser');
const postcss = require('postcss');
const cssnano = require('cssnano');

// Default HTML compression options
const DEFAULT_HTML_OPTIONS = {
  collapseWhitespace: 'conservative',    // Conservatively collapse whitespace
  removeComments: 'safe',                // Safely remove comments
  removeEmptyAttributes: true,           // Remove empty attributes
  minifyCss: true,                       // Minify inline CSS
  minifyJs: true,                        // Minify inline JavaScript
  minifySvg: true                        // Minify inline SVG
};

// Register HTML compression
hexo.extend.filter.register('after_render:html', async function (str) {
  // Merge default options with user-defined options from _config.yml
  const options = Object.assign({}, DEFAULT_HTML_OPTIONS, hexo.config.htmlnano || {});
  
  try {
    // Compress HTML using htmlnano
    const result = await htmlnano.process(str, options);
    const savedBytes = str.length - result.html.length;
    hexo.log.info(`HTML compressed: ${str.length} -> ${result.html.length} bytes (saved ${savedBytes} bytes)`);
    return result.html; // Return compressed HTML
  } catch (error) {
    hexo.log.error('HTML minification failed:', error);
    return str; // Return original HTML if compression fails
  }
});

// Register CSS compression with relaxed error handling
hexo.extend.filter.register('after_render:css', async function (str) {
  try {
    // Process CSS with postcss and cssnano, with error-catching for relaxed handling
    const result = await postcss([cssnano({
      preset: ['default', { // Configure cssnano to ignore certain errors
        discardUnused: false, // Avoid discarding unused @font-face rules etc.
        reduceIdents: false // Avoid renaming identifiers (e.g., keyframes)
      }]
    })]).process(str, { from: undefined });

    const savedBytes = str.length - result.css.length;
    hexo.log.info(`CSS compressed: ${str.length} -> ${result.css.length} bytes (saved ${savedBytes} bytes)`);
    return result.css; // Return compressed CSS
  } catch (error) {
    hexo.log.warn('CSS minification failed, skipping this part:', error);
    return str; // Return original CSS if compression fails
  }
});

// Register JavaScript compression
hexo.extend.filter.register('after_render:js', async function (str) {
  try {
    // Compress JavaScript using terser
    const result = await minify(str);
    const savedBytes = str.length - result.code.length;
    hexo.log.info(`JS compressed: ${str.length} -> ${result.code.length} bytes (saved ${savedBytes} bytes)`);
    return result.code; // Return compressed JavaScript
  } catch (error) {
    hexo.log.warn('JavaScript minification failed, skipping this part:', error);
    return str; // Return original JavaScript if compression fails
  }
});
