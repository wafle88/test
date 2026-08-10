<script setup>
import HeartLayout from '../components/HeartLayout.vue';
import portrait from '../assets/images/portrait.png';
import { goTo, next } from '../store/flow.js';
</script>

<template>
  <HeartLayout>
    <template #frame>
      <div class="portrait-wrap">
        <img class="portrait" :src="portrait" alt="" />
      </div>
      <p class="completion">촬영이<br />완료되었습니다</p>
      <div class="btn-container">
        <button class="btn" type="button" @click="goTo(4)">재촬영</button>
        <button class="btn" type="button" @click="next">사용하기</button>
      </div>
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

.completion {
  position: absolute;
  left: 50%;
  top: 49.9rem;
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
  text-shadow: 0 0.2rem 1.2rem rgba(0, 0, 0, 0.2);
}

.btn-container {
  position: absolute;
  left: 10.3rem;
  top: 67.1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn {
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
  white-space: nowrap;
}
</style>
