# wp-video-optimizer

> A plugin to optimize videos in the media library

https://user-images.githubusercontent.com/302736/220439245-e00965a6-0484-419c-b810-9c84a5268d16.mp4


## Requirements

- Modern browser (see ffmpeg requirements, note we're using 0.12.0-alpha version which does _NOT_ need `SharedArrayBuffer`).

## Features

- Adds a button to Optimize videos within the media library.
## Development

Install dependencies

    composer install
    npm install

Build assets

    # Minified assets which are to be committed to git
    npm run build:production

    # Watch for changes and re-compile while developing the plugin
    npm run start
