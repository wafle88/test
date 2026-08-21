<script setup>
import { nextTick, onMounted, ref } from 'vue';
import DejavuCard from '../components/DejavuCard.vue';
import { flow } from '../store/flow.js';

// 디자인팀 지정 카드 규격 (54 x 86mm). @page 와 값을 맞춰야 한다.
const CARD_W = '54mm';
const CARD_H = '86mm';

const photo = ref('');

onMounted(async () => {
  const api = window.dejavuCard;
  const payload = api ? await api.getPayload() : {};
  flow.name = payload.name || '';
  photo.value = payload.photo || '';

  await nextTick();
  // 폰트/이미지가 다 올라온 뒤에 찍어야 PDF 에 빠짐없이 들어간다
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((img) => img.decode().catch(() => {}))
  );
  // 컨테이너 쿼리(cqi) 가 실제 레이아웃을 잡을 수 있도록 한 프레임 양보
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  api?.signalReady();
});
</script>

<template>
  <DejavuCard :width="CARD_W" :height="CARD_H" :photo="photo" print-only />
</template>

<!-- 인쇄 전용 문서라 스코프 없이 페이지 자체를 카드 크기로 맞춘다 -->
<style>
@page {
  size: 54mm 86mm;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #fff;
}

#app {
  width: 54mm;
  height: 86mm;
  overflow: hidden;
}
</style>
