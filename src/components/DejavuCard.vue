<script setup>
import { computed } from 'vue';
import { flow } from '../store/flow.js';
import avatarPhoto from '../assets/images/card/avatar_photo.png';
import handleSvg from '../assets/images/card/handle.svg';
import noteSvg from '../assets/images/card/note.svg';
import wordmarkSvg from '../assets/images/card/dejavu_wordmark.svg';
import heartSvg from '../assets/images/card/heart.svg';

const props = defineProps({
  widthRem: { type: Number, default: 30 },
  // 화면 밖(인쇄 등)에서 mm 같은 물리 단위로 찍을 때 사용. 있으면 widthRem 보다 우선한다.
  width: { type: String, default: '' },
  height: { type: String, default: '' },
  photo: { type: String, default: '' },
  // 인쇄 PDF 용. 사진과 이름만 남기고 나머지 장식을 숨긴다.
  printOnly: { type: Boolean, default: false },
});

const displayName = computed(() => flow.name || '권은비');

// 피그마 원본 300x478 기준. 라운드는 폭에 비례(300 / 20 = 15)하므로 단위와 무관하게 계산된다.
const style = computed(() => {
  const w = props.width || `${props.widthRem}rem`;
  return {
    width: w,
    // 높이를 직접 주면 aspect-ratio 대신 그 값을 따른다 (CR80 처럼 비율이 살짝 다른 규격용)
    ...(props.height ? { height: props.height, aspectRatio: 'auto' } : null),
    borderRadius: `calc(${w} / 15)`,
    // 인쇄용: 카드 배경도 없애야 사진/이름만 종이에 찍힌다.
    ...(props.printOnly ? { background: 'transparent' } : null),
  };
});
</script>

<template>
  <div class="dejavu-card" :style="style">
    <template v-if="!printOnly">
      <div class="avatar">
        <img class="avatar__img" :src="avatarPhoto" alt="" />
      </div>
      <img class="handle" :src="handleSvg" alt="silver_rain.__" />
      <img class="note" :src="noteSvg" alt="" />
      <p class="track">{{ displayName }} · DEJAVU</p>
    </template>

    <div class="photo">
      <div class="photo__inner">
        <img v-if="photo" class="photo__img" :src="photo" alt="" />
        <p v-else-if="!printOnly" class="photo__placeholder">이 곳에<br />사진이<br />들어가요</p>
      </div>
    </div>

    <p class="name">{{ displayName }}</p>
    <template v-if="!printOnly">
      <img class="wordmark" :src="wordmarkSvg" alt="DEJAVU" />
      <img class="heart" :src="heartSvg" alt="" />
    </template>
  </div>
</template>

<style scoped lang="scss">
/* 피그마 300x478 기준. 1cqi = 3px */
.dejavu-card {
  position: relative;
  aspect-ratio: 300 / 478;
  background: #e7f0fa;
  overflow: hidden;
  container-type: inline-size;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 800;
  color: #231916;
}

.avatar {
  position: absolute;
  left: 10cqi;
  top: 6.3333cqi;
  width: 10.6667cqi;
  height: 10.6667cqi;
  border-radius: 50%;
  background: #000;
  overflow: hidden;

  &__img {
    position: absolute;
    left: -5.3402cqi;
    top: -0.3139cqi;
    width: 17.6433cqi;
    height: 11.7593cqi;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
}

.handle {
  position: absolute;
  left: 23.3333cqi;
  top: 7.3333cqi;
  width: 30cqi;
  height: 3.6667cqi;
  display: block;
  pointer-events: none;
}

.note {
  position: absolute;
  left: 23cqi;
  top: 13cqi;
  width: 2.3333cqi;
  height: 2.6667cqi;
  display: block;
  pointer-events: none;
}

.track {
  position: absolute;
  left: 26.6667cqi;
  top: 13cqi;
  margin: 0;
  font-size: 2cqi;
  line-height: 1;
  color: #231916;
  white-space: nowrap;
  pointer-events: none;
}

.photo {
  position: absolute;
  left: 10cqi;
  top: 20cqi;
  width: 80cqi;
  height: 111cqi;
  //border-radius: 5.3333cqi;
  //background: #fff;

  &__inner {
    position: absolute;
    inset: 1.6667cqi;
    border-radius: 4cqi;
    background: #fff;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__placeholder {
    margin: 0;
    font-size: 10cqi;
    line-height: 1.2;
    text-align: center;
    color: #231916;
  }
}

.name {
  position: absolute;
  left: 10cqi;
  top: 136cqi;
  margin: 0;
  font-size: 5.6667cqi;
  line-height: 1.18;
  color: #231916;
  white-space: nowrap;
}

.wordmark {
  position: absolute;
  left: 33.3333cqi;
  top: 136cqi;
  width: 56.6667cqi;
  height: 17.6667cqi;
  display: block;
  pointer-events: none;
}

.heart {
  position: absolute;
  left: 10cqi;
  top: 149.3333cqi;
  width: 5.6667cqi;
  height: 4.3333cqi;
  display: block;
  pointer-events: none;
}
</style>
