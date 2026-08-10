<script setup>
import bgImg from '../assets/images/step01_bg.jpg';
import logo from '../assets/images/dejavu_logo.svg';
import { next } from '../store/flow.js';
</script>

<template>
  <section class="step step01">
    <div class="bg">
      <img :src="bgImg" alt="" />
    </div>
    <img class="logo" :src="logo" alt="DEJAVU" />
    <button class="issue-btn" type="button" @click="next">카드 발급하기</button>
  </section>
</template>

<style scoped lang="scss">
.step01 {
  position: relative;
  width: 192rem;
  height: 108rem;
  background: #ff393c;
  overflow: hidden;

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 192rem;
    height: 128.7rem;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .logo {
    position: absolute;
    left: 111.7rem;
    top: 40.8rem;
    width: 75.83rem;
    height: 23.4rem;
    pointer-events: none;
  }

  .issue-btn {
    position: absolute;
    left: 153.9rem;
    top: 86.9rem;
    width: 28.1rem;
    height: 11.1rem;
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
}
</style>
