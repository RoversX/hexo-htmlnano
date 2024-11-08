# hexo-htmlnano-mini

![npm](https://img.shields.io/npm/v/hexo-htmlnano-mini) ![npm](https://img.shields.io/npm/l/hexo-htmlnano-mini) ![NPM Last Update](https://img.shields.io/npm/last-update/hexo-htmlnano-mini)

A lightweight Hexo plugin to minify HTML/css/js using [htmlnano](https://github.com/posthtml/htmlnano). This plugin helps reduce HTML file sizes, improving loading speed and optimizing site performance.

The reason for making this plugin is to replace https://github.com/hexojs/hexo-html-minifier

Npm Link: https://www.npmjs.com/package/hexo-htmlnano-mini

## Installation

To install `hexo-htmlnano-mini`, use the following command in your Hexo project:

```bash
npm install hexo-htmlnano-mini --save
```

## Configuration

After installation, add the following `htmlnano` configuration to your Hexo project’s `_config.yml` file. Adjust the settings as needed for your project.

```yaml
htmlnano-mini:
  enable: true                        # Main switch
  enableInDev: true                   # Whether to enable compression in the development server (hexo s)
  exclude: 
     #- '**/mycss.css'       
  collapseWhitespace: conservative    # Conservatively collapse whitespace characters
  removeComments: safe                # Safely remove comments
  removeEmptyAttributes: true         # Remove empty attributes
  cleancss: true                      # Enable clean-css to process inline CSS
  uglifyjs: true                      # Enable compression of inline JavaScript
```

## Usage

Once installed and configured, the plugin will automatically compress HTML files (including inline CSS, JS, and SVG) during the generation process. To apply the plugin, simply run:

```bash
hexo g
```

The plugin will log size reductions for each file, helping you track the compression progress.

## License

MIT License
