'use strict';

const htmlnano = require('htmlnano');
const presetDefault = require('htmlnano').presetDefault;
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
  const options = Object.assign({}, DEFAULT_HTML_OPTIONS, hexo.config.htmlnano || {});
  
  try {
    const result = await htmlnano.process(str, options);
    const savedBytes = str.length - result.html.length;
    hexo.log.info(`HTML compressed: ${str.length} -> ${result.html.length} bytes (saved ${savedBytes} bytes)`);
    return result.html; // Return compressed HTML
  } catch (error) {
    hexo.log.error('HTML minification failed:', error);
    return str; // Return original HTML if compression fails
  }
});

// Register CSS compression
hexo.extend.filter.register('after_render:css', async function (str, data) {
  try {
    const result = await postcss([cssnano]).process(str, { from: undefined });
    const savedBytes = str.length - result.css.length;
    hexo.log.info(`CSS compressed: ${str.length} -> ${result.css.length} bytes (saved ${savedBytes} bytes)`);
    return result.css; // Return compressed CSS
  } catch (error) {
    hexo.log.error('CSS minification failed:', error);
    return str; // Return original CSS if compression fails
  }
});

// Register JS compression
hexo.extend.filter.register('after_render:js', async function (str, data) {
  try {
    const result = await minify(str);
    const savedBytes = str.length - result.code.length;
    hexo.log.info(`JS compressed: ${str.length} -> ${result.code.length} bytes (saved ${savedBytes} bytes)`);
    return result.code; // Return compressed JavaScript
  } catch (error) {
    hexo.log.error('JavaScript minification failed:', error);
    return str; // Return original JavaScript if compression fails
  }
});