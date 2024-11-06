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
  minifyJs: true,                        // Minify inline JavaScript
  minifySvg: true,                       // Minify inline SVG
  minifyCss: {                          // Custom CSS minification configuration
    preset: ['default', {
      discardComments: { removeAll: true },
      normalizeWhitespace: true,
      minifySelectors: false,           // Disable selector minification
      calc: false,                      // Disable calc optimization
      colormin: false,                  // Disable color minification
      discardEmpty: false,              // Don't remove empty rules
      mergeRules: false                 // Don't merge rules
    }]
  }
};

// Register HTML compression
hexo.extend.filter.register('after_render:html', async function(str) {
  const options = Object.assign({}, DEFAULT_HTML_OPTIONS, hexo.config.htmlnano || {});
  
  try {
    const result = await htmlnano.process(str, options);
    const savedBytes = str.length - result.html.length;
    hexo.log.info(`HTML compressed: ${str.length} -> ${result.html.length} bytes (saved ${savedBytes} bytes)`);
    return result.html;
  } catch (error) {
    hexo.log.error('HTML minification failed:', error);
    return str;
  }
});

// Register CSS compression with relaxed error handling
hexo.extend.filter.register('after_render:css', async function(str) {
  try {
    const result = await postcss([
      cssnano({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: false,
          calc: false,
          colormin: false,
          discardEmpty: false,
          mergeRules: false
        }]
      })
    ]).process(str, { 
      from: undefined,
      parser: require('postcss-safe-parser')  // prevent css problem
    });
    
    const savedBytes = str.length - result.css.length;
    hexo.log.info(`CSS compressed: ${str.length} -> ${result.css.length} bytes (saved ${savedBytes} bytes)`);
    return result.css;
  } catch (error) {
    hexo.log.warn('CSS minification failed, skipping this part:', error);
    return str;
  }
});

// Register JavaScript compression
hexo.extend.filter.register('after_render:js', async function(str) {
  try {
    const result = await minify(str, {
      compress: {
        defaults: true,
        drop_console: false,
        keep_fnames: true
      },
      mangle: false
    });
    const savedBytes = str.length - result.code.length;
    hexo.log.info(`JS compressed: ${str.length} -> ${result.code.length} bytes (saved ${savedBytes} bytes)`);
    return result.code;
  } catch (error) {
    hexo.log.warn('JavaScript minification failed, skipping this part:', error);
    return str;
  }
});