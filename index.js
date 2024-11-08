'use strict';
const htmlnano = require('htmlnano');
const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');
const posthtml = require('posthtml');
const micromatch = require('micromatch');

// Initialize CleanCSS instance once
const cleanCSS = new CleanCSS({
  level: {
    1: { specialComments: 0 },
    2: { all: true }
  }
});

// Plugin default configuration
const DEFAULT_PLUGIN_OPTIONS = {
  enable: true,
  enableInDev: false,
  exclude: [],
  cleancss: true,
  uglifyjs: true
};

// htmlnano default options
const DEFAULT_HTML_OPTIONS = {
  collapseWhitespace: 'conservative',
  removeComments: 'safe',
  removeEmptyAttributes: true,
  minifyJs: false,  // Disable htmlnano's minifyJs option
  minifyCss: false  // Disable htmlnano's minifyCss option
};

// UglifyJS options
const UGLIFY_OPTIONS = {
  compress: {
    drop_console: false,
    keep_fnames: true
  },
  mangle: false,
  output: {
    quote_style: 1  // Use single quotes
  }
};

// Deep merge function
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] instanceof Object &&
      !Array.isArray(source[key]) &&
      target[key] instanceof Object
    ) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Create processing options
function createProcessOptions(hexo) {
  const pluginConfig = hexo.config['htmlnano-mini'] || {};
  const { enable, enableInDev, exclude, cleancss, uglifyjs, ...userHtmlOptions } = pluginConfig;
  
  return deepMerge({...DEFAULT_HTML_OPTIONS}, userHtmlOptions);
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
  const config = hexo.config['htmlnano-mini'] || {};
  return (config.enable ?? DEFAULT_PLUGIN_OPTIONS.enable) &&
         (isServer() ? (config.enableInDev ?? DEFAULT_PLUGIN_OPTIONS.enableInDev) : true);
}

// Check if file should be excluded
function shouldExclude(path, hexo) {
  if (!path) return false;
  const exclude = hexo.config['htmlnano-mini']?.exclude ?? DEFAULT_PLUGIN_OPTIONS.exclude;
  return micromatch.isMatch(path, exclude);
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

// Check if content is potentially encrypted
function isEncryptedContent(content) {
  content = content.trim();
  // Check if it's a pure hash/encrypted string
  if (/^[a-f0-9]{32,}$/i.test(content)) {
    return true;
  }
  // Check if contains encryption-related keywords or Base64
  if (content.includes('CryptoJS') || 
      content.includes('encrypt') || 
      content.includes('decrypt') ||
      /^[a-zA-Z0-9+/]{32,}={0,2}$/.test(content)) {
    return true;
  }
  return false;
}

// JS minification function
function minifyJS(code, filename, hexo) {
  if (isEncryptedContent(code)) {
    return code;  // If content is encrypted, return as is
  }

  try {
    const result = UglifyJS.minify(code, UGLIFY_OPTIONS);
    if (result.error) {
      hexo.log.debug(`JS minification warning for ${filename}: ${result.error}`);
      return code;
    }
    return result.code;
  } catch (error) {
    hexo.log.debug(`JS minification skipped for ${filename}`);
    return code;
  }
}

// Register HTML compression and inline CSS/JS compression
hexo.extend.filter.register('after_render:html', async function(str, data) {
  showCompressionNotice(hexo);
  if (!isEnabled(hexo)) return str;

  // Skip excluded files
  if (data?.path && shouldExclude(data.path, hexo)) {
    return str;
  }

  try {
    const options = createProcessOptions(hexo);

    // Use posthtml to process inline CSS and JS
    let html = await posthtml([
      async function processInlineAssets(tree) {
        // Minify CSS in <style> tags and style attributes
        if (hexo.config['htmlnano-mini']?.cleancss) {
          tree.match({ tag: 'style' }, node => {
            if (node.content) {
              const originalCss = node.content.join('');
              const minifiedCss = cleanCSS.minify(originalCss).styles;
              node.content = [minifiedCss];
            }
            return node;
          });

          tree.walk(node => {
            if (node.attrs && node.attrs.style) {
              const originalCss = node.attrs.style;
              const cssRule = `selector { ${originalCss} }`;
              const minifiedCss = cleanCSS.minify(cssRule).styles;
              const minifiedStyle = minifiedCss.replace(/^selector\s*\{\s*(.*?)\s*\}\s*$/, '$1');
              node.attrs.style = minifiedStyle;
            }
            return node;
          });
        }

        // Minify JS in <script> tags
        if (hexo.config['htmlnano-mini']?.uglifyjs) {
          tree.match({ tag: 'script' }, node => {
            // Check if it's an inline script, not an external script reference
            if (!node.attrs || !node.attrs.src) {
              if (node.content) {
                const originalJs = node.content.join('');
                node.content = [minifyJS(originalJs, `${data?.path || 'unknown'} (inline)`, hexo)];
              }
            }
            return node;
          });
        }
      }
    ]).process(str);

    // Use htmlnano for HTML compression
    const result = await htmlnano.process(html.html, options);
    return result.html;

  } catch (error) {
    hexo.log.error('HTML minification failed:', error);
    hexo.log.error('File:', data?.path || 'unknown file');
    return str;
  }
});

// Register standalone JS file compression
hexo.extend.filter.register('after_render:js', function(str, data) {
  if (!isEnabled(hexo)) return str;
  if (!hexo.config['htmlnano-mini']?.uglifyjs) return str;
  
  if (data?.path && shouldExclude(data.path, hexo)) {
    return str;
  }

  return minifyJS(str, data?.path || 'unknown file', hexo);
});