<script setup>
import { computed, ref } from 'vue';
import Keyboard from '../components/Keyboard.vue';
import { flow, next } from '../store/flow.js';
import { HangulComposer } from '../utils/hangul.js';

const phase = ref('pin'); // 'pin' | 'name'

const displayPin = computed(() => {
  if (!flow.pin) return '7812-3424';
  const digits = flow.pin.replace(/[^0-9]/g, '').slice(0, 8);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
});

const composer = new HangulComposer();
composer.reset(flow.name);
const nameText = ref(composer.text);

function syncName() {
  nameText.value = composer.text;
  flow.name = composer.text;
}

const displayName = computed(() => nameText.value || '권은비');

const instruction = computed(() =>
  phase.value === 'pin'
    ? '매장에서 발급받은 코드번호를 입력해주세요'
    : '데자뷰 카드에 인쇄될 이름을 입력해주세요'
);

function submitPin() {
  phase.value = 'name';
}

function submitName() {
  composer.commit();
  syncName();
  next();
}

function onKey(k) {
  if (phase.value === 'pin') {
    if (k === 'BACKSPACE') {
      flow.pin = flow.pin.slice(0, -1);
    } else if (k === 'ENTER') {
      submitPin();
    } else if (/^[0-9]$/.test(k)) {
      if (flow.pin.length < 8) flow.pin += k;
    }
    return;
  }

  if (k === 'BACKSPACE') {
    composer.backspace();
  } else if (k === 'ENTER') {
    submitName();
    return;
  } else if (k === 'CAPS' || k === 'SHIFT' || k === 'TAB' || k === 'LANG') {
    return;
  } else if (k.length === 1) {
    if (composer.text.length >= 12) return;
    composer.input(k);
  }
  syncName();
}

function submit() {
  if (phase.value === 'pin') submitPin();
  else submitName();
}
</script>

<template>
  <section class="step step02">
    <p class="instruction">{{ instruction }}</p>

    <div class="code-container">
      <p class="code-text">
        <template v-if="phase === 'pin'">{{ displayPin }}</template>
        <template v-else>{{ displayName }}</template>
      </p>
    </div>

    <button class="submit-btn" type="button" @click="submit">입력완료</button>

    <div class="keyboard-wrap">
      <Keyboard @key="onKey" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.step02 {
  position: relative;
  width: 192rem;
  height: 108rem;
  background: #ff393c;
  overflow: hidden;

  .instruction {
    position: absolute;
    left: 50%;
    top: 20rem;
    transform: translateX(-50%);
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 900;
    font-size: 3rem;
    color: #fff;
    letter-spacing: -0.12rem;
    line-height: 1;
    white-space: nowrap;
  }

  .code-container {
    position: absolute;
    left: 50%;
    top: 27rem;
    transform: translateX(-50%);
    width: 100rem;
    padding: 3rem 0;
    background: #fff;
    border-radius: 13rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .code-text {
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 800;
    font-size: 6rem;
    color: #ff393c;
    letter-spacing: -0.24rem;
    line-height: 1;
    white-space: nowrap;
  }

  .submit-btn {
    position: absolute;
    left: 50%;
    top: 41.9rem;
    transform: translateX(-50%);
    padding: 4rem 6rem;
    background: #fff;
    border: none;
    border-radius: 8rem;
    color: #ff393c;
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 800;
    font-size: 3.1rem;
    letter-spacing: -0.124rem;
    line-height: 1;
    cursor: pointer;
  }

  .keyboard-wrap {
    position: absolute;
    left: 50%;
    top: 60.4rem;
    transform: translateX(-50%);
  }
}
</style>