<script setup>
import { computed } from 'vue';
import Keyboard from '../components/Keyboard.vue';
import { flow, next } from '../store/flow.js';

const displayPin = computed(() => {
  if (!flow.pin) return '7812-3424';
  const digits = flow.pin.replace(/[^0-9]/g, '').slice(0, 8);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
});

function onKey(k) {
  if (k === 'BACKSPACE') {
    flow.pin = flow.pin.slice(0, -1);
  } else if (k === 'ENTER') {
    submit();
  } else if (/^[0-9]$/.test(k)) {
    if (flow.pin.length < 8) flow.pin += k;
  }
}

function submit() {
  next();
}
</script>

<template>
  <section class="step step02">
    <p class="instruction">매장에서 발급받은 코드번호를 입력해주세요</p>

    <div class="code-container">
      <p class="code-text">{{ displayPin }}</p>
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
