<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import { flow, next } from '../store/flow.js';

const phase = ref('preview'); // 'preview' | 'countdown' | 'confirm'
const count = ref(3);
const capturedUrl = ref('');
const flash = ref(false);

const videoEl = ref(null);
let stream = null;
let countdownId = null;
let flashTimerId = null;
let audioCtx = null;

function playShutter() {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    const duration = 0.12;
    const buffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * duration), audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const t = i / audioCtx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 45);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.6;
    source.connect(gain).connect(audioCtx.destination);
    source.start();
  } catch (err) {
    console.warn('셔터음 재생 실패:', err);
  }
}

function triggerFlash() {
  flash.value = true;
  if (flashTimerId) clearTimeout(flashTimerId);
  flashTimerId = setTimeout(() => {
    flash.value = false;
    flashTimerId = null;
  }, 260);
}

async function startCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
    }
  } catch (err) {
    console.error('웹캠을 사용할 수 없습니다:', err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null;
  }
}

function capture() {
  const video = videoEl.value;
  if (!video || !video.videoWidth) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  // 미러 상태로 보이는 그대로 캡처
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedUrl.value = canvas.toDataURL('image/png');
}

function startCountdown() {
  phase.value = 'countdown';
  count.value = 3;
  countdownId = setInterval(() => {
    count.value -= 1;
    if (count.value <= 0) {
      clearInterval(countdownId);
      countdownId = null;
      playShutter();
      triggerFlash();
      capture();
      phase.value = 'confirm';
    }
  }, 1000);
}

function retake() {
  capturedUrl.value = '';
  phase.value = 'preview';
}

function use() {
  flow.photo = capturedUrl.value;
  next();
}

onMounted(startCamera);

onBeforeUnmount(() => {
  if (countdownId) clearInterval(countdownId);
  if (flashTimerId) clearTimeout(flashTimerId);
  stopCamera();
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
});
</script>

<template>
  <HeartLayout theme="white">
    <template #frame>
      <div class="portrait-wrap">
        <video
          v-show="phase !== 'confirm'"
          ref="videoEl"
          class="portrait"
          autoplay
          playsinline
          muted
        ></video>
        <img
          v-if="phase === 'confirm' && capturedUrl"
          class="portrait portrait--shot"
          :src="capturedUrl"
          alt=""
        />
      </div>

      <p v-if="phase === 'preview'" class="instruction">카메라를 바라 보세요</p>

      <p v-else-if="phase === 'countdown'" class="count">{{ count }}</p>

      <p v-else-if="phase === 'confirm'" class="completion">촬영을 완료했어요</p>

      <div class="shutter-flash" :class="{ 'shutter-flash--on': flash }"></div>
    </template>

    <button
      v-if="phase === 'preview'"
      class="start-btn"
      type="button"
      @click="startCountdown"
    >촬영 시작</button>

    <div v-if="phase === 'confirm'" class="btn-container">
      <button class="btn btn--secondary" type="button" @click="retake">재촬영</button>
      <button class="btn btn--primary" type="button" @click="use">그대로 사용</button>
    </div>
  </HeartLayout>
</template>

<style scoped lang="scss">
.portrait-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #fff;
  transform: scaleX(-1);
}

.portrait--shot {
  transform: none;
}

.instruction {
  position: absolute;
  left: 50%;
  top: calc(50% + 12.8rem);
  transform: translateX(-50%);
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 900;
  font-size: 6rem;
  color: #fff;
  text-align: center;
  letter-spacing: -0.24rem;
  line-height: 1.2;
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  white-space: nowrap;
  text-shadow: 0 0.2rem 1.2rem rgba(0, 0, 0, 0.4);
}

.count {
  position: absolute;
  left: 50%;
  // 피그마(step05)는 캡 높이~베이스라인으로 트리밍된 박스를 기준으로 좌표를 잡는다.
  // text-box-trim 을 쓰면 폰트 메트릭 보정 없이 피그마 좌표(+223px)를 그대로 쓸 수 있다.
  top: calc(50% + 22.3rem);
  transform: translateX(-50%);
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 600;
  font-size: 20rem;
  color: #fff;
  letter-spacing: -0.8rem;
  line-height: 1.2;
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  text-align: center;
  text-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.35);
}

.completion {
  position: absolute;
  left: 50%;
  top: calc(50% + 12.8rem);
  transform: translateX(-50%);
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 900;
  font-size: 6rem;
  color: #fff;
  text-align: center;
  letter-spacing: -0.24rem;
  line-height: 1.2;
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  white-space: nowrap;
  text-shadow: 0 0.2rem 1.2rem rgba(0, 0, 0, 0.4);
}

.start-btn {
  position: absolute;
  left: 50%;
  top: 79.7rem;
  transform: translateX(-50%);
  padding: 4rem 6rem;
  background: #ff393c;
  border: none;
  border-radius: 8rem;
  color: #fff;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 800;
  font-size: 3.1rem;
  letter-spacing: -0.124rem;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  z-index: 5;
}

.btn-container {
  position: absolute;
  left: 50%;
  top: 79.7rem;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  align-items: center;
  z-index: 5;
}

.btn {
  padding: 4rem 6rem;
  border: none;
  border-radius: 8rem;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 800;
  font-size: 3.1rem;
  letter-spacing: -0.124rem;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;

  &--primary {
    background: #ff393c;
    color: #fff;
  }

  &--secondary {
    background: #fff;
    color: #ff393c;
  }
}

.shutter-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  z-index: 100;
  transition: opacity 220ms ease-out;

  &--on {
    opacity: 1;
    transition: opacity 40ms ease-out;
  }
}
</style>
