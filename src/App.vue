<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { flow, goTo } from './store/flow.js';
import Step01 from './views/Step01.vue';
import Step02 from './views/Step02.vue';
import Step03 from './views/Step03.vue';
import Step04 from './views/Step04.vue';
import stripPattern from './assets/images/strip_pattern.svg';
import stripPatternRed from './assets/images/strip_pattern_red.svg';
import dejavuBg from './assets/images/dejavu_bg_pattern.png';
import dejavuBgRed from './assets/images/dejavu_bg_pattern_red.png';
import step01Bg from './assets/images/step01_bg.jpg';
import portrait from './assets/images/portrait.png';
import idCard from './assets/images/id_card.png';
import testProfileImg from './assets/images/test-profile.png';
import testSportsImg from './assets/images/test-sports.png';

// 첫 진입 시 이미지 pop-in을 막기 위해 앱 부팅 시점에 프리로드
[stripPattern, stripPatternRed, dejavuBg, dejavuBgRed, step01Bg, portrait, idCard].forEach((src) => {
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

// --- 개발용 코드 사용 기록 확인 패널 ---
const isDev = ref(false);
const showUsedCodes = ref(false);
const usedCodes = ref([]);
// F10 으로 개발용 UI(dev-nav, dev-codes) 토글. 초기값은 숨김.
const showDevUI = ref(false);

function handleDevUIToggle(e) {
  if (e.key === 'F10') {
    e.preventDefault();
    showDevUI.value = !showDevUI.value;
  }
}

onMounted(async () => {
  isDev.value = (await window.dejavuCard?.isDev?.()) === true;
  window.addEventListener('keydown', handleDevUIToggle);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleDevUIToggle);
});

function formatCode(code) {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

async function toggleUsedCodes() {
  showUsedCodes.value = !showUsedCodes.value;
  if (showUsedCodes.value) await loadUsedCodes();
}

async function loadUsedCodes() {
  const list = await window.dejavuCard?.listUsedCodes?.();
  usedCodes.value = Array.isArray(list) ? list : [];
}

async function revealUsedCodes() {
  const res = await window.dejavuCard?.revealUsedCodes?.();
  if (!res?.ok) console.error('사용 기록 폴더 열기 실패:', res);
}

async function clearUsedCodes() {
  const res = await window.dejavuCard?.clearUsedCodes?.();
  if (!res?.ok) {
    console.error('사용 기록 초기화 실패:', res?.error);
    return;
  }
  await loadUsedCodes();
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
    <nav v-if="showDevUI" class="dev-nav">
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
      <button
        v-if="isDev"
        class="dev-nav__test"
        :class="{ active: showUsedCodes }"
        type="button"
        @click="toggleUsedCodes"
      >
        CODE
      </button>
    </nav>

    <div v-if="showDevUI && isDev && showUsedCodes" class="dev-codes">
      <div class="dev-codes__head">
        <span>사용된 코드 {{ usedCodes.length }}개</span>
        <button type="button" @click="loadUsedCodes">새로고침</button>
        <button type="button" @click="revealUsedCodes">폴더</button>
        <button type="button" @click="clearUsedCodes">초기화</button>
      </div>
      <ul v-if="usedCodes.length" class="dev-codes__list">
        <li v-for="code in usedCodes" :key="code">{{ formatCode(code) }}</li>
      </ul>
      <p v-else class="dev-codes__empty">아직 사용된 코드가 없습니다.</p>
    </div>
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

.dev-codes {
  position: fixed;
  right: 12px;
  bottom: 52px;
  width: 240px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
  z-index: 9999;

  &__head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;

    span {
      flex: 1;
      font-size: 11px;
      opacity: 0.8;
    }

    button {
      padding: 2px 6px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      color: #fff;
      font-size: 10px;
      cursor: pointer;
    }
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
  }

  &__empty {
    margin: 0;
    opacity: 0.6;
  }
}
</style>
