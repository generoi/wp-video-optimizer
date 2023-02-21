export default class Resource {
  constructor(resource) {
    this.resource = resource;
    this.acodec = 'aac';
    this.vcodec = 'libx264';
    this.crf = 23;
  }

  setRemoveAudio() {
    this.acodec = null;
  }

  setCrf(crf) {
    this.crf = crf;
  }

  get originalFilename() {
    return this.resource.split('/').pop();
  }

  get extension() {
    const parts = this.originalFilename.split('.');
    return parts.pop();
  }

  get basename() {
    const parts = this.originalFilename.split('.');
    parts.pop();
    return parts.join('.');
  }

  get filename() {
    return `${this.basename}-crf-${this.crf}${this.acodec === null ? '-noaudio' : ''}.${this.extension}`;
  }

  get ffmpegArgs() {
    return [
      '-vcodec',
      this.vcodec,
      '-crf',
      `${this.crf}`,
      '-movflags',
      'faststart',
      ...(this.acodec ? ['-acodec', 'aac'] : ['-an'])
    ];
  }
}
