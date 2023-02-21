const mix = require('laravel-mix');

mix.setPublicPath('./dist');
mix.js('assets/scripts/main.js', 'dist')
  .vue({
    version: 3,
    extractStyles: false,
    globalStyles: false,
  });

mix.copyDirectory('node_modules/@ffmpeg/core/dist/', 'dist/ffmpeg-core');
