'use strict';
const htmlnano = require('htmlnano');
const { minify } = require('terser');
const postcss = require('postcss');
const cssnano = require('cssnano');

// Default compression options
const DEFAULT_HTML_OPTIONS = {
  enable: true,                        // Enable by default
  enableInDev: false,                  // Disable in development mode by default
  collapseWhitespace: 'conservative',    
  removeComments: 'safe',                
  removeEmptyAttributes: true,           
  minifyJs: true,                        
  minifyCss: {                          
    preset: ['default', {
      discardComments: { removeAll: true },
      normalizeWhitespace: true,
      minifySelectors: false,           
      calc: false,                      
      colormin: false,                  
      discardEmpty: false,              
      mergeRules: false                 
    }]
  }
};

// Create processing options (excluding control options)
function createProcessOptions(hexo) {
  const { enable, enableInDev, ...processOptions } = DEFAULT_HTML_OPTIONS;
  const userConfig = hexo.config.htmlnano || {};
  const { enable: userEnable, enableInDev: userEnableInDev, ...userProcessOptions } = userConfig;
  
  return Object.assign({}, processOptions, userProcessOptions);
}

// Check if in generate/deploy phase
function isGenerating() {
  const args = process.argv;
  return args.includes('generate') || args.includes('g') || 
         args.includes('deploy') || args.includes('d');
}

// Check if in server (development) phase
function isServer() {
  const args = process.argv;
  return args.includes('server') || args.includes('s');
}

// Determine if the plugin is enabled
function isEnabled(hexo) {
  const config = hexo.config.htmlnano;
  const enable = config?.enable ?? DEFAULT_HTML_OPTIONS.enable;
  const enableInDev = config?.enableInDev ?? DEFAULT_HTML_OPTIONS.enableInDev;
  
  return enable && (isServer() ? enableInDev : true);
}

let compressionNoticeShown = false;

// Show compression status message
function showCompressionNotice(hexo) {
  if (!compressionNoticeShown && isEnabled(hexo)) {
    const mode = isServer() ? 'development' : 'production';
    hexo.log.info(`HTML/CSS/JS compression is enabled in ${mode} mode`);
    compressionNoticeShown = true;
  }
}

// Register HTML compression
hexo.extend.filter.register('after_render:html', async function(str) {
  showCompressionNotice(hexo);
  if (!isEnabled(hexo)) return str;
  
  try {
    const options = createProcessOptions(hexo);
    const result = await htmlnano.process(str, options);
    return result.html;
  } catch (error) {
    hexo.log.error('HTML minification failed:', error);
    return str;
  }
});

// Register CSS compression
hexo.extend.filter.register('after_render:css', async function(str) {
  if (!isEnabled(hexo)) return str;
  
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
      from: undefined
    });
    
    return result.css;
  } catch (error) {
    hexo.log.error('CSS minification failed:', error);
    return str;
  }
});

// Register JavaScript compression
hexo.extend.filter.register('after_render:js', async function(str) {
  if (!isEnabled(hexo)) return str;
  
  try {
    const result = await minify(str, {
      compress: {
        defaults: true,
        drop_console: false,
        keep_fnames: true
      },
      mangle: false
    });
    return result.code;
  } catch (error) {
    hexo.log.error('JavaScript minification failed:', error);
    return str;
  }
});