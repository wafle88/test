<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Keyboard from '../components/Keyboard.vue';
import { flow, goTo, next, resetFlow } from '../store/flow.js';
import { HangulComposer } from '../utils/hangul.js';
import issuedCodes from '../data/codes.json';
import { MASTER_CODE } from '../utils/masterCode.js';

// 매장에서 발급한 코드 목록. 조회만 하므로 Set 으로 한 번만 만들어 둔다.
const CODE_SET = new Set(issuedCodes);

// 이미 카드가 나간 코드는 메인 프로세스가 파일로 들고 있다. 화면 진입 시 한 번만 읽어온다.
let usedCodes = new Set();
const usedCodesReady = (async () => {
  try {
    const list = await window.dejavuCard?.listUsedCodes?.();
    if (Array.isArray(list)) usedCodes = new Set(list);
  } catch (err) {
    // 목록을 못 읽으면 재사용 차단만 빠지고 코드 검증 자체는 계속 동작한다.
    console.warn('사용된 코드 목록을 불러오지 못했습니다:', err);
  }
})();

const phase = ref('pin'); // 'pin' | 'name'

// 입력 전에는 실제 값처럼 보이면 안 되므로 placeholder 로 흐리게 보여준다.
const PIN_PLACEHOLDER = '0000-0000';
const NAME_PLACEHOLDER = '이름을 입력해주세요';

const displayPin = computed(() => {
  if (!flow.pin) return PIN_PLACEHOLDER;
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

const displayName = computed(() => nameText.value || NAME_PLACEHOLDER);

const isPlaceholder = computed(() =>
  phase.value === 'pin' ? !flow.pin : !nameText.value
);

const formError = ref('');

// 손님이 자리를 뜨거나 멈춰 있으면 다음 손님을 위해 처음 화면으로 돌아간다.
const IDLE_TIMEOUT_MS = 30000;
let idleTimerId = null;

function armIdleTimer() {
  if (idleTimerId) clearTimeout(idleTimerId);
  idleTimerId = setTimeout(() => {
    resetFlow();
    goTo(1);
  }, IDLE_TIMEOUT_MS);
}

onMounted(armIdleTimer);

onBeforeUnmount(() => {
  if (idleTimerId) clearTimeout(idleTimerId);
});

const instruction = computed(() =>
  phase.value === 'pin'
    ? '매장에서 발급받은 코드 번호를 입력하세요'
    : '카드에 인쇄할 이름을 입력하세요'
);

async function submitPin() {
  const digits = flow.pin.replace(/[^0-9]/g, '');
  if (digits.length < 8) {
    formError.value = '코드 번호 8자리를 모두 입력해주세요';
    return;
  }
  // 만능키는 발급 목록에도 없고 사용 처리도 안 되므로 두 검사를 모두 건너뛴다.
  if (digits === MASTER_CODE) {
    formError.value = '';
    phase.value = 'name';
    return;
  }
  if (!CODE_SET.has(digits)) {
    formError.value = '등록되지 않은 코드 번호예요. 다시 확인해주세요';
    return;
  }
  await usedCodesReady;
  if (usedCodes.has(digits)) {
    formError.value = '이미 사용된 코드 번호예요';
    return;
  }
  formError.value = '';
  phase.value = 'name';
}

function submitName() {
  composer.commit();
  syncName();
  if (!nameText.value.trim()) {
    formError.value = '이름을 입력해주세요';
    return;
  }
  formError.value = '';
  next();
}

function onKey(k) {
  armIdleTimer();
  if (phase.value === 'pin') {
    if (k === 'BACKSPACE') {
      flow.pin = flow.pin.slice(0, -1);
      formError.value = '';
    } else if (k === 'ENTER') {
      submitPin();
    } else if (/^[0-9]$/.test(k)) {
      if (flow.pin.length < 8) flow.pin += k;
      formError.value = '';
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
  formError.value = '';
  syncName();
}

function submit() {
  armIdleTimer();
  if (phase.value === 'pin') submitPin();
  else submitName();
}
</script>

<template>
  <section class="step step02">
    <p class="instruction">{{ instruction }}</p>

    <div class="code-container">
      <p class="code-text" :class="{ 'code-text--placeholder': isPlaceholder }">
        <template v-if="phase === 'pin'">{{ displayPin }}</template>
        <template v-else>{{ displayName }}</template>
      </p>
    </div>

    <button class="submit-btn" type="button" @click="submit">입력 완료</button>

    <p v-if="formError" class="input-error">{{ formError }}</p>

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
  background: #fff;
  overflow: hidden;

  .instruction {
    position: absolute;
    left: 50%;
    top: 20rem;
    transform: translateX(-50%);
    margin: 0;
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 900;
    font-size: 3rem;
    color: #ff393c;
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
    border: 0.2rem solid #ff393c;
    border-radius: 13rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .code-text {
    margin: 0;
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 800;
    font-size: 6rem;
    color: #000;
    letter-spacing: -0.24rem;
    line-height: 1;
    white-space: nowrap;

    &--placeholder {
      color: rgba(0, 0, 0, 0.2);
    }
  }

  .submit-btn {
    position: absolute;
    left: 50%;
    top: 41.9rem;
    transform: translateX(-50%);
    padding: 4rem 6rem;
    background: #ff393c;
    border: none;
    border-radius: 8rem;
    color: #fff;
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 800;
    font-size: 3.1rem;
    letter-spacing: -0.124rem;
    line-height: 1;
    cursor: pointer;
  }

  .input-error {
    position: absolute;
    left: 50%;
    top: 55rem;
    transform: translateX(-50%);
    margin: 0;
    font-family: 'Pretendard', -apple-system, sans-serif;
    font-weight: 800;
    font-size: 2.6rem;
    color: #ff393c;
    letter-spacing: -0.104rem;
    line-height: 1;
    white-space: nowrap;
  }

  .keyboard-wrap {
    position: absolute;
    left: 50%;
    top: 60.4rem;
    transform: translateX(-50%);
  }
}
</style>
