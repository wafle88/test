<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import DejavuCard from '../components/DejavuCard.vue';
import { flow, goTo } from '../store/flow.js';

const phase = ref('issuing'); // 'issuing' | 'done'
const printError = ref('');
let timerId = null;
// '발급중' 최소 표시 시간과 실제 인쇄 완료 중 늦은 쪽에 맞춰 done 으로 전환한다.
let minWaitDone = false;
let printDone = false;

function maybeFinish() {
  if (minWaitDone && printDone) {
    phase.value = 'done';
  }
}

// DejavuCard 의 .photo 규격 (300x478 카드 단위). 인쇄 시에도 이 비율/라운드를 그대로 써야 한다.
const PHOTO_W_UNITS = 80;
const PHOTO_H_UNITS = 111;
const PHOTO_RADIUS_UNITS = 5.3333;
// 300 카드 단위에 대해 10배 해상도로 마스킹. 54mm 인쇄 기준 대략 375DPI 이상이라 인쇄 화질에 여유가 있다.
const MASK_SCALE = 10;
// IDP dye-sub 카드 프린터가 소스보다 어둡게 인쇄되는 걸 보정한다.
// 1 미만이면 미드톤/섀도우를 들어올림. 너무 낮추면 색이 날아가고 채도가 떨어지니 약하게 (0.92).
const PRINT_GAMMA = 0.92;
// 프린터가 대비를 원본보다 강하게 뽑아내는 경향 보정. 1 미만이면 톤 범위가 좁아져서
// 부드러운 미드톤이 살아남 (0.80 = 확실히 부드럽게, 0.90 = 살짝, 1.0 = 보정 없음).
// 공식: out = (in - 128) * PRINT_CONTRAST + 128
const PRINT_CONTRAST = 0.85;

function maskPhotoToCardShape(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetW = PHOTO_W_UNITS * MASK_SCALE;
      const targetH = PHOTO_H_UNITS * MASK_SCALE;
      const radius = PHOTO_RADIUS_UNITS * MASK_SCALE;

      // object-fit: cover 와 동일하게 중앙 기준으로 크롭
      const srcRatio = img.width / img.height;
      const dstRatio = targetW / targetH;
      let sx, sy, sw, sh;
      if (srcRatio > dstRatio) {
        sh = img.height;
        sw = sh * dstRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / dstRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      // 라운드 사각형 마스크. roundRect 미지원 환경 대비 fallback 포함.
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, targetW, targetH, radius);
      } else {
        const r = Math.min(radius, targetW / 2, targetH / 2);
        ctx.moveTo(r, 0);
        ctx.lineTo(targetW - r, 0);
        ctx.quadraticCurveTo(targetW, 0, targetW, r);
        ctx.lineTo(targetW, targetH - r);
        ctx.quadraticCurveTo(targetW, targetH, targetW - r, targetH);
        ctx.lineTo(r, targetH);
        ctx.quadraticCurveTo(0, targetH, 0, targetH - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
      }
      ctx.clip();

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      // 프린터 톤 보정: 감마(어두움) + 대비 압축(부드러운 톤 보존) 을 하나의 LUT 로 한 번에 적용.
      // 1. 감마: out = in^PRINT_GAMMA — 미드톤을 들어올림
      // 2. 대비 압축: out = (out - 128) * PRINT_CONTRAST + 128 — 톤 범위를 중앙으로 좁힘
      // 라운드 마스크 밖은 alpha=0 이라 RGB 가 바뀌어도 시각적 영향 없음.
      if (PRINT_GAMMA !== 1 || PRINT_CONTRAST !== 1) {
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const d = imageData.data;
        const lut = new Uint8ClampedArray(256);
        for (let i = 0; i < 256; i += 1) {
          const gammaCorrected = 255 * Math.pow(i / 255, PRINT_GAMMA);
          const contrastAdjusted = (gammaCorrected - 128) * PRINT_CONTRAST + 128;
          lut[i] = Math.round(Math.max(0, Math.min(255, contrastAdjusted)));
        }
        for (let i = 0; i < d.length; i += 4) {
          d[i]     = lut[d[i]];
          d[i + 1] = lut[d[i + 1]];
          d[i + 2] = lut[d[i + 2]];
        }
        ctx.putImageData(imageData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('촬영 이미지를 마스킹하기 위해 로드하는 데 실패했습니다.'));
    img.src = dataUrl;
  });
}

onMounted(async () => {
  if (flow.photo) {
    try {
      flow.photo = await maskPhotoToCardShape(flow.photo);
    } catch (err) {
      console.warn('사진 마스킹 실패, 원본 이미지를 그대로 사용합니다:', err);
    }
  }

  // '발급하고 있어요' 문구를 최소 3초는 보여준다.
  timerId = setTimeout(() => {
    minWaitDone = true;
    timerId = null;
    maybeFinish();
  }, 3000);

  // 마스킹된 사진 기준으로 실제 인쇄를 걸고, 완료되면 done 전환 조건을 충족시킨다.
  const api = window.dejavuCard;
  if (!api?.print) {
    // 앱(Electron) 컨텍스트가 아니면 인쇄 단계는 즉시 통과 (dev/브라우저 실행 대비)
    printDone = true;
    maybeFinish();
    return;
  }
  try {
    await api.print({ name: flow.name, photo: flow.photo });
  } catch (err) {
    console.error('카드 인쇄 실패:', err);
    printError.value = err?.message || '카드 인쇄에 실패했습니다.';
  } finally {
    printDone = true;
    maybeFinish();
  }
});

onUnmounted(() => {
  if (timerId) clearTimeout(timerId);
});

function restart() {
  if (phase.value !== 'done') return;
  flow.pin = '';
  flow.name = '';
  flow.photo = '';
  goTo(1);
}
</script>

<template>
  <HeartLayout
    theme="red"
    :show-frame="false"
    :show-strips="false"
    :show-id-card="false"
    :bg-opacity="0.3"
  >
    <div class="card-wrap" :class="{ 'card-wrap--clickable': phase === 'done' }" @click="restart">
      <DejavuCard :width-rem="36.1" :photo="flow.photo" />
    </div>
    <p class="status">
      <template v-if="phase === 'issuing'">DEJAVU 카드를<br />발급하고 있어요</template>
      <template v-else>DEJAVU 카드 발급을<br />완료했어요!</template>
    </p>
    <p v-if="phase === 'done' && printError" class="print-error">{{ printError }}</p>
  </HeartLayout>
</template>

<style scoped lang="scss">
.card-wrap {
  position: absolute;
  left: 50%;
  top: calc(50% - 10.6rem);
  transform: translate(-50%, -50%);

  &--clickable {
    cursor: pointer;
  }
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

.print-error {
  position: absolute;
  left: 50%;
  bottom: 4rem;
  transform: translateX(-50%);
  margin: 0;
  padding: 1.2rem 2.4rem;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 4rem;
  color: #fff;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 600;
  font-size: 2rem;
  letter-spacing: -0.05rem;
  white-space: nowrap;
}
</style>
