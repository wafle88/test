<script setup>
import { computed } from 'vue';
import stripPatternWhite from '../assets/images/strip_pattern.svg';
import stripPatternRed from '../assets/images/strip_pattern_red.svg';
import dejavuBgWhite from '../assets/images/dejavu_bg_pattern.png';
import dejavuBgRed from '../assets/images/dejavu_bg_pattern_red.png';
import IdCard from './IdCard.vue';

const props = defineProps({
  showFrame: { type: Boolean, default: true },
  showStrips: { type: Boolean, default: true },
  showIdCard: { type: Boolean, default: false },
  bgOpacity: { type: Number, default: 1 },
  theme: { type: String, default: 'red' }, // 'red' | 'white'
});

// 스트립/워터마크 아트웍은 배경색에 따라 색이 반전된다.
// 레드 배경에는 흰 아트웍, 화이트 배경(피그마 step04~06)에는 레드 아트웍.
const stripPattern = computed(() => (props.theme === 'white' ? stripPatternRed : stripPatternWhite));
const dejavuBg = computed(() => (props.theme === 'white' ? dejavuBgRed : dejavuBgWhite));
</script>

<template>
  <section class="heart-layout" :class="`heart-layout--${theme}`">
    <img
      class="bg-pattern"
      :src="dejavuBg"
      :style="{ opacity: bgOpacity }"
      alt=""
    />
    <template v-if="showStrips">
      <img class="strip strip--top" :src="stripPattern" alt="" />
      <img class="strip strip--bottom" :src="stripPattern" alt="" />
    </template>

    <div v-if="showFrame" class="profile-frame">
      <slot name="frame" />
    </div>

    <div v-if="showIdCard" class="id-card-slot">
      <IdCard :width-rem="30" />
    </div>

    <slot />
  </section>
</template>

<style scoped lang="scss">
.heart-layout {
  position: relative;
  width: 192rem;
  height: 108rem;
  overflow: hidden;

  &--red {
    background: #ff393c;
  }

  &--white {
    background: #fff;
  }
}

.bg-pattern {
  //position: absolute;
  //left: -32.8rem;
  //top: 16.7rem;
  //width: 241.567rem;
  //height: 74.54rem;
  pointer-events: none;
}

.strip {
  position: absolute;
  left: 3.1rem;
  width: 215.2rem;
  height: 7.2rem;
  pointer-events: none;

  &--top {
    top: 2.8rem;
  }

  &--bottom {
    bottom: 2rem;
  }
}

.profile-frame {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  // 피그마 기준 프레임은 테두리 포함 596x828 이다. border-box 로 잡아야
  // 프레임 안쪽 좌표(안내 문구 / 카운트다운)가 피그마 값과 그대로 맞는다.
  box-sizing: border-box;
  width: 59.6rem;
  height: 82.8rem;
  background: #fff;
  border: 0.887rem solid #fff;
  border-radius: 5.7337rem;
  overflow: hidden;
}

.id-card-slot {
  position: absolute;
  left: 145.5rem;
  top: 50%;
  transform: translateY(-50%);
}
</style>
