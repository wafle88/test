<script setup>
import { onMounted, onUnmounted } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import IdCard from '../components/IdCard.vue';
import { next } from '../store/flow.js';

let timerId = null;
onMounted(() => {
  timerId = setTimeout(next, 3000);
});
onUnmounted(() => {
  if (timerId) clearTimeout(timerId);
});
</script>

<template>
  <HeartLayout :show-frame="false" :show-strips="false" :show-id-card="false" :bg-opacity="0.3">
    <div class="big-card">
      <IdCard :width-rem="36.1" />
    </div>
    <p class="status">
      DEJAVU 카드가<br />발급 중입니다
    </p>
  </HeartLayout>
</template>

<style scoped lang="scss">
.big-card {
  position: absolute;
  left: 50%;
  top: calc(50% - 10.6rem);
  transform: translate(-50%, -50%);
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
