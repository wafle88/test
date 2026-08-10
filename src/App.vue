<script setup>
import { defineAsyncComponent } from 'vue';
import { flow, goTo } from './store/flow.js';

const steps = {
  1: defineAsyncComponent(() => import('./views/Step01.vue')),
  2: defineAsyncComponent(() => import('./views/Step02.vue')),
  3: defineAsyncComponent(() => import('./views/Step03.vue')),
  4: defineAsyncComponent(() => import('./views/Step04.vue')),
  5: defineAsyncComponent(() => import('./views/Step05.vue')),
  6: defineAsyncComponent(() => import('./views/Step06.vue')),
  7: defineAsyncComponent(() => import('./views/Step07.vue')),
  8: defineAsyncComponent(() => import('./views/Step08.vue')),
};

const stepIds = [1, 2, 3, 4, 5, 6, 7, 8];
</script>

<template>
  <div class="stage">
    <component :is="steps[flow.step]" />
    <nav class="dev-nav">
      <button
        v-for="id in stepIds"
        :key="id"
        :class="{ active: flow.step === id }"
        @click="goTo(id)"
      >
        {{ id }}
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}
.dev-nav {
  position: fixed;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  z-index: 9999;

  button {
    width: 26px;
    height: 26px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: transparent;
    color: #fff;
    font-size: 12px;
    cursor: pointer;

    &.active {
      background: #fff;
      color: #000;
    }
  }
}
</style>
