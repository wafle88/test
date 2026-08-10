<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import portrait from '../assets/images/portrait.png';
import { next } from '../store/flow.js';

const count = ref(3);
let timerId = null;

onMounted(() => {
  timerId = setInterval(() => {
    count.value -= 1;
    if (count.value <= 0) {
      clearInterval(timerId);
      timerId = null;
      next();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
</script>

<template>
  <HeartLayout>
    <template #frame>
      <div class="portrait-wrap">
        <img class="portrait" :src="portrait" alt="" />
      </div>
      <p class="count">{{ count }}</p>
    </template>
  </HeartLayout>
</template>

<style scoped lang="scss">
.portrait-wrap {
  position: absolute;
  left: -40.9rem;
  top: -29.7rem;
  width: 140.957rem;
  height: 127.6rem;
  border: 5.877rem solid #fff;
  box-sizing: border-box;
  overflow: hidden;
  pointer-events: none;
}

.portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.count {
  position: absolute;
  left: 50%;
  top: 63.7rem;
  transform: translateX(-50%);
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 600;
  font-size: 20rem;
  color: #fff;
  letter-spacing: -0.8rem;
  line-height: 1.2;
  text-align: center;
  text-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.25);
}
</style>
