<script setup>
import { computed, ref } from 'vue';
import backspaceIcon from '../assets/images/backspace.svg';

const emit = defineEmits(['key']);

const lang = ref('ko');
const caps = ref(false);
// 한 번 눌러 다음 키 한 개에만 shift 를 적용하는 one-shot 방식.
// 화면상 SHIFT 를 다시 누르면 취소, 문자 키를 누르면 자동 해제.
const shift = ref(false);

const row1 = ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+'];

const rowMap = {
  row2: {
    ko: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', '[', ']'],
    en: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  },
  row3: {
    ko: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ', ':', '“'],
    en: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  },
  row4: {
    ko: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', ',', '.', '/'],
    en: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  },
};

// 표준 두벌식 배열의 shift 매핑. 나머지 자모는 shift 변형이 없다.
const KO_SHIFT_MAP = {
  ㅂ: 'ㅃ', ㅈ: 'ㅉ', ㄷ: 'ㄸ', ㄱ: 'ㄲ', ㅅ: 'ㅆ',
  ㅐ: 'ㅒ', ㅔ: 'ㅖ',
};

const row2Trailing = computed(() => (lang.value === 'ko' ? '₩' : '\\'));

const row2 = computed(() => transformRow(rowMap.row2[lang.value]));
const row3 = computed(() => transformRow(rowMap.row3[lang.value]));
const row4 = computed(() => transformRow(rowMap.row4[lang.value]));

function transformRow(row) {
  if (lang.value === 'ko') {
    return shift.value ? row.map((c) => KO_SHIFT_MAP[c] || c) : row;
  }
  // EN: caps 와 shift 의 XOR — 표준 하드웨어 키보드 관례.
  const upper = caps.value !== shift.value;
  if (upper) return row.map((c) => (/[a-z]/.test(c) ? c.toUpperCase() : c));
  return row;
}

function press(value) {
  if (value === 'LANG') {
    lang.value = lang.value === 'ko' ? 'en' : 'ko';
    caps.value = false;
    shift.value = false;
    emit('key', 'LANG');
    return;
  }
  if (value === 'CAPS') {
    if (lang.value === 'en') caps.value = !caps.value;
    emit('key', 'CAPS');
    return;
  }
  if (value === 'SHIFT') {
    shift.value = !shift.value;
    emit('key', 'SHIFT');
    return;
  }
  emit('key', value);
  // 문자·기능 키 어떤 것이든 shift 를 소모해 다음 입력엔 영향 없게 한다.
  if (shift.value) shift.value = false;
}
</script>

<template>
  <div class="keyboard">
    <div class="keys">
      <div class="row">
        <button v-for="c in row1" :key="c" class="key" @click="press(c)">{{ c }}</button>
        <button class="key key--wide2" @click="press('BACKSPACE')">
          <img :src="backspaceIcon" alt="backspace" />
        </button>
      </div>
      <div class="row">
        <button class="key key--fn" @click="press('TAB')">TABS</button>
        <button v-for="c in row2" :key="c" class="key" @click="press(c)">{{ c }}</button>
        <button class="key key--fn" @click="press(row2Trailing)">{{ row2Trailing }}</button>
      </div>
      <div class="row">
        <button
          class="key key--fn key--caps"
          :class="{ 'key--active': caps }"
          @click="press('CAPS')"
        >CAPS LOCK</button>
        <button v-for="c in row3" :key="c" class="key" @click="press(c)">{{ c }}</button>
        <button class="key key--fn key--enter" @click="press('ENTER')">ENTER</button>
      </div>
      <div class="row">
        <button
          class="key key--fn key--shift"
          :class="{ 'key--active': shift }"
          @click="press('SHIFT')"
        >SHIFT</button>
        <button v-for="c in row4" :key="c" class="key" @click="press(c)">{{ c }}</button>
        <button
          class="key key--fn key--shift"
          :class="{ 'key--active': shift }"
          @click="press('SHIFT')"
        >SHIFT</button>
      </div>
      <div class="row row--last">
        <button class="key key--space" @click="press(' ')"></button>
        <button
          class="key key--wide2"
          :class="{ 'key--active': lang === 'en' }"
          @click="press('LANG')"
        >{{ lang === 'ko' ? '한/영' : 'KOR' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.keyboard {
  background: #ff393c;
  border: 0.3rem solid #000;
  border-radius: 2rem;
  padding: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.keys {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  width: 103.8rem;

  &--last {
    justify-content: flex-end;
  }
}

.key {
  width: 6.4rem;
  height: 6.4rem;
  background: #fff;
  border: 0.2rem solid #000;
  border-radius: 0.6rem;
  color: #000;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 800;
  font-size: 2.4rem;
  line-height: 1.3;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 3.721rem;
    height: 2.5rem;
    display: block;
  }

  &--fn {
    font-size: 2rem;
    flex: 1 1 0;
    min-width: 0;
  }

  &--wide2 {
    width: 12.8rem;
    flex: none;
  }

  &--enter {
    background: #ff393c;
    color: #fff;
  }

  &--active {
    background: #ff393c;
    color: #fff;
  }

  &--space {
    width: 21.2rem;
    height: 6.4rem;
    background: transparent;
    border: none;
    padding: 0;
    cursor: default;
  }

  &:active:not(&--space) {
    transform: translateY(0.1rem);
    background: #ff393c;
    color: #fff;

    // backspace 아이콘은 검정 SVG 라서 빨간 배경 위에선 흰색으로 뒤집어 준다.
    img {
      filter: brightness(0) invert(1);
    }
  }

  // ENTER 는 평소가 이미 #ff393c 라 같은 색으로는 눌린 티가 안 난다. 색을 서로 바꿔 표시.
  &--enter:active {
    background: #fff;
    color: #ff393c;
  }
}
</style>
