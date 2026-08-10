<script setup>
import { computed } from 'vue';
import { flow } from '../store/flow.js';
import idCardBg from '../assets/images/id_card.png';

const props = defineProps({
  widthRem: { type: Number, default: 30 },
});

const displayName = computed(() => flow.name || '권은비');

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = `${pad(today.getMonth() + 1)}.${pad(today.getDate())}`;

const style = computed(() => ({
  width: `${props.widthRem}rem`,
}));
</script>

<template>
  <div class="id-card" :style="style">
    <img class="bg" :src="idCardBg" alt="" />
    <div class="cover cover--name">
      <span>{{ displayName }}</span>
    </div>
    <div class="cover cover--date">
      <span>{{ dateStr }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.id-card {
  position: relative;
  aspect-ratio: 745 / 1187;
  overflow: hidden;
  container-type: inline-size;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
  line-height: 1;
}

.bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.cover {
  position: absolute;
  right: 8.34%;
  height: 5%;
  min-width: 20%;
  padding: 0 0.5cqi;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 4.57cqi;
  letter-spacing: -0.02em;

  &--name {
    top: 79.9%;
    background: #fff;
    color: #000;
  }

  &--date {
    top: 89.2%;
    background: #000;
    color: #f7b9d4;
  }
}
</style>
