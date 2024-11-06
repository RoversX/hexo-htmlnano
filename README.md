# hexo-htmlnano-mini

A lightweight Hexo plugin to minify HTML using [htmlnano](https://github.com/posthtml/htmlnano). This plugin helps reduce HTML file sizes, improving loading speed and optimizing site performance.



## Installation

To install `hexo-htmlnano-mini`, use the following command in your Hexo project:

```bash
npm install hexo-htmlnano-mini --save
```

## Configuration

After installation, add the following `htmlnano` configuration to your Hexo project’s `_config.yml` file. Adjust the settings as needed for your project.

```yaml
htmlnano:
  collapseWhitespace: conservative    # Collapse whitespace conservatively
  removeComments: safe                # Safely remove comments
  removeEmptyAttributes: true         # Remove empty attributes
  minifyCss: true                     # Enable inline CSS minification
  minifyJs: true                      # Enable inline JavaScript minification
  minifySvg: true                     # Enable inline SVG minification
```



> **Note**: `minifyCss`, `minifyJs`, and `minifySvg` require additional dependencies (`cssnano`, `postcss`, `terser`, and `svgo`). These are already included in this plugin.



## Usage

Once installed and configured, the plugin will automatically compress HTML files (including inline CSS, JS, and SVG) during the generation process. To apply the plugin, simply run:

```bash
hexo g
```

The plugin will log size reductions for each file, helping you track the compression progress.

## License

MIT License
