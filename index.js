'use strict';

const htmlnano = require('htmlnano');
const presetDefault = require('htmlnano').presetDefault;

// Default options - includes commonly used and safe compression settings
const DEFAULT_OPTIONS = {
  collapseWhitespace: 'conservative',    // Collapse whitespace in HTML (conservative mode)
  removeComments: 'safe',                // Safely remove comments
  removeEmptyAttributes: true            // Remove empty attributes
};

// Register a Hexo filter to compress HTML after rendering
hexo.extend.filter.register('after_render:html', async function (str) {
  // Merge default options with user-configured options (if defined in _config.yml)
  const options = {
    ...presetDefault,
    ...DEFAULT_OPTIONS,
    ...(hexo.config.htmlnano || {})
  };
  
  try {
    // Compress HTML using htmlnano
    const result = await htmlnano.process(str, options);
    return result.html; // Return the compressed HTML
  } catch (error) {
    hexo.log.error('HTML minification failed:', error);
    return str; // Return the original HTML if compression fails
  }
});
