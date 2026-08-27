import { createApp } from 'vue';
import './assets/scss/libs/reset.scss';
// 인쇄용 숨김 창(PrintCard)도 이 renderer.js 를 태우므로 여기서 import 하면
// 앱 화면과 인쇄 모두 동일 Pretendard 로 렌더된다.
import './assets/scss/libs/pretendard.scss';

// ?mode=print 로 열리는 창은 인쇄용 숨김 창이다.
// base.scss(빨간 배경 / vw 기반 rem / text-stroke)는 인쇄물을 망가뜨리므로 이 분기에서는 싣지 않는다.
const isPrint = new URLSearchParams(location.search).get('mode') === 'print';

async function boot() {
  if (isPrint) {
    const { default: PrintCard } = await import('./views/PrintCard.vue');
    createApp(PrintCard).mount('#app');
    return;
  }

  await import('./assets/scss/libs/base.scss');
  const { default: App } = await import('./App.vue');
  createApp(App).mount('#app');
}

boot();
