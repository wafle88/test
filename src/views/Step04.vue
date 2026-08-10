<script setup>
import HeartLayout from '../components/HeartLayout.vue';
import portrait from '../assets/images/portrait.png';
import { next } from '../store/flow.js';
</script>

<template>
  <HeartLayout>
    <template #frame>
      <div class="portrait-wrap">
        <img class="portrait" :src="portrait" alt="" />
      </div>
      <p class="instruction">
        안내선에 따라 카메라를<br />바라봐주세요
      </p>
      <button class="start-btn" type="button" @click="next">촬영 시작하기</button>
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

.instruction {
  position: absolute;
  left: 50%;
  top: calc(50% - 7.2rem);
  transform: translateX(-50%);
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 900;
  font-size: 6rem;
  color: #fff;
  text-align: center;
  letter-spacing: -0.24rem;
  line-height: 1.2;
  white-space: nowrap;
  margin: 0;
  text-shadow: 0 0.2rem 1.2rem rgba(0, 0, 0, 0.15);
}

.start-btn {
  position: absolute;
  left: 50%;
  top: 67rem;
  transform: translateX(-50%);
  padding: 4rem 6rem;
  background: #ff393c;
  border: 0.2rem solid #000;
  border-radius: 8rem;
  color: #fff;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 800;
  font-size: 3.1rem;
  letter-spacing: -0.124rem;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
}
</style>
