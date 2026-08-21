<script setup>
import { flow, goTo } from './store/flow.js';
import Step01 from './views/Step01.vue';
import Step02 from './views/Step02.vue';
import Step03 from './views/Step03.vue';
import Step04 from './views/Step04.vue';
import stripPattern from './assets/images/strip_pattern.svg';
import dejavuBg from './assets/images/dejavu_bg_pattern.svg';
import step01Bg from './assets/images/step01_bg.jpg';
import portrait from './assets/images/portrait.png';
import idCard from './assets/images/id_card.png';
import testProfileImg from './assets/images/test-profile.png';
import testSportsImg from './assets/images/test-sports.png';

// 첫 진입 시 이미지 pop-in을 막기 위해 앱 부팅 시점에 프리로드
[stripPattern, dejavuBg, step01Bg, portrait, idCard].forEach((src) => {
  const img = new Image();
  img.src = src;
});

const steps = {
  1: Step01,
  2: Step02,
  3: Step03,
  4: Step04,
};

const stepIds = [1, 2, 3, 4];

// 테스트 인쇄 프리셋. 각 항목의 버튼을 눌러 고정 이미지로 Step04 로 점프시켜
// 마스킹+인쇄 파이프라인을 그대로 태운다. 이미지 추가하려면 이 배열만 늘리면 됨.
const testPresets = [
  { label: 'T1', name: '테스트-프로필', src: testProfileImg },
  { label: 'T2', name: '테스트-스포츠', src: testSportsImg },
];

async function urlToDataUrl(src) {
  const blob = await fetch(src).then((r) => r.blob());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function runTestPrint(preset) {
  flow.name = preset.name;
  flow.photo = await urlToDataUrl(preset.src);
  goTo(4);
}
</script>

<template>
  <div class="stage">
    <component :is="steps[flow.step]" />
    <nav class="dev-nav">
      <button
        v-for="id in stepIds"
        :key="id"
        :class="{ active: flow.step === id }"
        @click="goTo(id)"
      >
        {{ id }}
      </button>
      <button
        v-for="preset in testPresets"
        :key="preset.label"
        class="dev-nav__test"
        type="button"
        @click="runTestPrint(preset)"
      >
        {{ preset.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #ff393c;
}
.dev-nav {
  position: fixed;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  z-index: 9999;

  button {
    width: 26px;
    height: 26px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: transparent;
    color: #fff;
    font-size: 12px;
    cursor: pointer;

    &.active {
      background: #fff;
      color: #000;
    }
  }

  &__test {
    width: auto !important;
    padding: 0 8px;
    margin-left: 6px;
    letter-spacing: 0.5px;
  }
}
</style>
