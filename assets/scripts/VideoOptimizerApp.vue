<template>
  <p :class="$style.instructions">The quality can be lower if it is a slow moving video with uniform colors. If the video is fast panning or uses a background color with many shades the quality needs to be higher.</p>

  <div :class="$style.qualityButtons">
    <button @click="state.crf = 30" :class="['button', $style.button, state.crf === 30 ? 'active' : '']">1 (low)</button>
    <button @click="state.crf = 25" :class="['button', $style.button, state.crf === 25 ? 'active' : '']">2</button>
    <button @click="state.crf = 23" :class="['button', $style.button, state.crf === 23 ? 'active' : '']">3</button>
    <button @click="state.crf = 20" :class="['button', $style.button, state.crf === 20 ? 'active' : '']">4</button>
    <button @click="state.crf = 18" :class="['button', $style.button, state.crf === 18 ? 'active' : '']">5 (high)</button>
  </div>

  <label :class="$style.checkbox">
    <input v-model="state.noaudio" type="checkbox" value="1">
    Remove audio
  </label>

  <button
    @click.prevent="onTranscode"
    class="button"
    :disabled="!state.crf || state.isRunning"
  >
    Create optimized video
  </button>

  <div v-if="state.transcodedBlob">
    <p>Please preview the video and check that the quality is acceptable. If not you can re-run with a different quality setting.</p>
    <video :src="videoUrl" controls></video>
    <p>Size: {{ Math.round(state.transcodedBlob.size / 1024 / 1024) }} MB</p>

    <button
      class="button"
      @click.prevent="onUpload"
    >Upload to WordPress</button>
  </div>

  <div v-if="state.progress || state.status" :class="$style.progress">
    <span v-if="state.progress">{{ state.progress }}%</span>
    <span v-else-if="state.status">{{ state.status }}</span>
  </div>

  <div v-if="state.attachment">
    <a :href="attachmentUrl">View attachment</a> |
    <a :href="sourceUrl">Video URL</a>
  </div>
</template>

<style lang="scss" module>
.instructions {
  margin-top: 0;
}

.qualityButtons {
  display: flex;

  .button {
    margin-left: -1px;
    border-radius: 0;

    &:first-child {
      border-top-left-radius: 3px;
      border-bottom-left-radius: 3px;
    }

    &:last-child {
      border-top-right-radius: 3px;
      border-bottom-right-radius: 3px;
    }
  }
}

.progress {
  margin-top: 1em;
  margin-bottom: 1em;
}

.checkbox {
  display: block;
  margin-top: 1em;
  margin-bottom: 1em;

  input {
    margin-top: 0 !important;
  }
}
</style>

<script setup>
import { computed, onMounted, reactive, defineProps, ref, unref } from 'vue'
import { FFmpeg } from '@ffmpeg/ffmpeg';
import apiFetch from '@wordpress/api-fetch';
import Resource from './resource';

const props = defineProps({
  resourceUrl: String,
  restNonce: String,
  adminPath: String,
  attachmentData: Object,
  ffmpegCorePath: String,
});

const state = reactive({
  crf: 23,
  noaudio: false,
  transcodedBlob: null,
  progress: null,
  isRunning: false,
  status: '',
  attachment: null,
})

const videoUrl = computed(() => {
  return URL.createObjectURL(state.transcodedBlob);
})

const attachmentUrl = computed(() => {
  return `${props.adminPath}?item=${state.attachment.id}`;
})

const sourceUrl = computed(() => {
  return state.attachment.source_url;
});

async function fetchFile(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function toBlobUrl(url, mimeType = 'text/javascript') {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
}

function setStatus(status) {
  console.log(status);
  state.status = status;
}

async function setupFFmpeg() {
  const ffmpeg = new FFmpeg();
  ffmpeg.on(FFmpeg.LOG, ({message}) => console.debug(message));
  ffmpeg.on(FFmpeg.PROGRESS, ({progress}) => state.progress = Math.round(progress * 100));

  await ffmpeg.load({
    coreURL: await toBlobUrl('https://unpkg.com/@ffmpeg/core@0.12.0-alpha.2/dist/umd/ffmpeg-core.js'),
    wasmURL: await toBlobUrl('https://unpkg.com/@ffmpeg/core@0.12.0-alpha.2/dist/umd/ffmpeg-core.wasm', 'application/wasm'),
    workerURL: await toBlobUrl(props.ffmpegCorePath.replace(/.js$/, '.worker.js')),
    blob: true,
  });

  return ffmpeg;
}

async function onTranscode(e) {
  state.transcodedBlob = null;
  state.isRunning = true;

  const resource = state.resource = new Resource(props.resourceUrl);
  resource.setCrf(state.crf);
  if (state.noaudio) {
    resource.setRemoveAudio();
  }

  setStatus('Loading library...');
  const ffmpeg = await setupFFmpeg();

  setStatus('Downloading video for session...');
  await ffmpeg.writeFile(resource.originalFilename, await fetchFile(props.resourceUrl));

  setStatus('Running optimization...');
  await ffmpeg.exec(['-i', resource.originalFilename, ...resource.ffmpegArgs, resource.filename]);

  setStatus('Retrieving transcoded video...');
  const data = await ffmpeg.readFile(resource.filename);
  state.transcodedBlob = new Blob([data.buffer], {type: 'video/mp4'});

  state.isRunning = false;
  setStatus('');
  state.progress = null;
}

async function onUpload() {
  setStatus('Uploading...');

  const formData = new FormData();
  formData.append('file', state.transcodedBlob, state.resource.filename);

  for (const [key, value] of Object.entries(props.attachmentData)) {
    formData.append(key, value);
  }

  const response = await apiFetch({
    path: '/wp-json/wp/v2/media',
    method: 'POST',
    withCredentials: true,
    headers: {
      'X-WP-Nonce': props.restNonce,
      //'Content-Disposition': `form-data`,
    },
    body: formData,
  });
  setStatus('Done!');
  state.attachment = response;

  // Trigger a refresh of the media library if on upload.php page
  window.wp?.media?.frame?.library?.props?.set?.({ignore: (+ new Date())});
}
</script>
