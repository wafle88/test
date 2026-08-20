<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import DejavuCard from '../components/DejavuCard.vue';
import { flow, goTo } from '../store/flow.js';

const phase = ref('issuing'); // 'issuing' | 'done'
const saving = ref(false);
const saved = ref(false);
let timerId = null;
let savedTimerId = null;

onMounted(() => {
  timerId = setTimeout(() => {
    phase.value = 'done';
    timerId = null;
  }, 3000);
});

onUnmounted(() => {
  if (timerId) clearTimeout(timerId);
  if (savedTimerId) clearTimeout(savedTimerId);
});

async function savePdf() {
  const api = window.dejavuCard;
  if (!api) {
    console.warn('PDF 저장은 앱(Electron)에서만 동작합니다.');
    return;
  }
  if (saving.value) return;
  saving.value = true;
  try {
    const result = await api.exportPdf({ name: flow.name, photo: flow.photo });
    console.log('PDF 저장 완료:', result.filePath);
    saved.value = true;
    if (savedTimerId) clearTimeout(savedTimerId);
    savedTimerId = setTimeout(() => {
      saved.value = false;
      savedTimerId = null;
    }, 2000);
  } catch (err) {
    console.error('PDF 저장 실패:', err);
  } finally {
    saving.value = false;
  }
}

function restart() {
  if (phase.value !== 'done') return;
  flow.pin = '';
  flow.name = '';
  flow.photo = '';
  goTo(1);
}
</script>

<template>
  <HeartLayout
    theme="red"
    :show-frame="false"
    :show-strips="false"
    :show-id-card="false"
    :bg-opacity="0.3"
  >
    <div class="card-wrap" :class="{ 'card-wrap--clickable': phase === 'done' }" @click="restart">
      <DejavuCard :width-rem="36.1" :photo="flow.photo" />
    </div>
    <p class="status">
      <template v-if="phase === 'issuing'">DEJAVU 카드를<br />발급하고 있어요</template>
      <template v-else>DEJAVU 카드 발급을<br />완료했어요!</template>
    </p>
    <button
      v-if="phase === 'done'"
      class="pdf-btn"
      type="button"
      :disabled="saving"
      @click.stop="savePdf"
    >
      {{ saving ? '저장 중…' : saved ? '저장 완료' : '카드 PDF 저장' }}
    </button>
  </HeartLayout>
</template>

<style scoped lang="scss">
.card-wrap {
  position: absolute;
  left: 50%;
  top: calc(50% - 10.6rem);
  transform: translate(-50%, -50%);

  &--clickable {
    cursor: pointer;
  }
}

.status {
  position: absolute;
  left: 50%;
  bottom: 15rem;
  transform: translateX(-50%);
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 900;
  font-size: 6rem;
  color: #fff;
  text-align: center;
  letter-spacing: -0.24rem;
  line-height: 1.2;
  white-space: nowrap;
}

.pdf-btn {
  position: absolute;
  left: 50%;
  bottom: 4rem;
  transform: translateX(-50%);
  padding: 1.6rem 4rem;
  background: #fff;
  border: none;
  border-radius: 8rem;
  color: #ff393c;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 800;
  font-size: 2.4rem;
  letter-spacing: -0.05rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}
</style>
