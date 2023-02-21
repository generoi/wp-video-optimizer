__webpack_public_path__ = window.videoOptimizerWebpackPublicPath;

async function setupApp(element) {
  const [
    {createApp, defineAsyncComponent},
  ] = await Promise.all([
    import('vue'),
  ]);

  const VideoOptimizerApp = defineAsyncComponent(() => import('./VideoOptimizerApp.vue'));


  const app = createApp({});
  app.component('video-optimizer-app', VideoOptimizerApp);
  app.mount(element);
  return app;
}

document.addEventListener('click', (e) => {
  if (e.target.matches('[data-video-optimizer-init')) {
    e.preventDefault();
    setupApp(e.target.closest('.video-optimizer-wrapper'));
  }
});
