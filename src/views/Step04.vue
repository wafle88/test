<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import IdCard from '../components/IdCard.vue';
import { flow, goTo } from '../store/flow.js';

const phase = ref('issuing'); // 'issuing' | 'done'
let timerId = null;

onMounted(() => {
  timerId = setTimeout(() => {
    phase.value = 'done';
    timerId = null;
  }, 3000);
});

onUnmounted(() => {
  if (timerId) clearTimeout(timerId);
});

function restart() {
  if (phase.value !== 'done') return;
  flow.pin = '';
  flow.name = '';
  goTo(1);
}
</script>

<template>
  <HeartLayout :show-frame="false" :show-strips="false" :show-id-card="false" :bg-opacity="0.3">
    <div class="big-card" :class="{ 'big-card--clickable': phase === 'done' }" @click="restart">
      <IdCard :width-rem="36.1" />
    </div>
    <p class="status">
      <template v-if="phase === 'issuing'">DEJAVU 카드가<br />발급 중입니다</template>
      <template v-else>DEJAVU 카드 발급이<br />완료 되었습니다!</template>
    </p>
  </HeartLayout>
</template>

<style scoped lang="scss">
.big-card {
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
</style>
