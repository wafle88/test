<script setup>
import stripPattern from '../assets/images/strip_pattern.svg';
import dejavuBg from '../assets/images/dejavu_bg_pattern.svg';
import IdCard from './IdCard.vue';

defineProps({
  showFrame: { type: Boolean, default: true },
  showStrips: { type: Boolean, default: true },
  showIdCard: { type: Boolean, default: false },
  bgOpacity: { type: Number, default: 1 },
  theme: { type: String, default: 'red' }, // 'red' | 'white'
});
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
  position: absolute;
  left: -32.8rem;
  top: 16.7rem;
  width: 241.567rem;
  height: 74.54rem;
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
