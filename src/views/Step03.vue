<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import HeartLayout from '../components/HeartLayout.vue';
import { next } from '../store/flow.js';

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
  <HeartLayout>
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

      <template v-if="phase === 'preview'">
        <p class="instruction">
          안내선에 따라 카메라를<br />바라봐주세요
        </p>
        <button class="start-btn" type="button" @click="startCountdown">촬영 시작하기</button>
      </template>

      <p v-else-if="phase === 'countdown'" class="count">{{ count }}</p>

      <template v-else-if="phase === 'confirm'">
        <p class="completion">촬영이<br />완료되었습니다</p>
        <div class="btn-container">
          <button class="btn" type="button" @click="retake">재촬영</button>
          <button class="btn" type="button" @click="use">사용하기</button>
        </div>
      </template>

      <div class="shutter-flash" :class="{ 'shutter-flash--on': flash }"></div>
    </template>
  </HeartLayout>
</template>

<style scoped lang="scss">
.portrait-wrap {
  position: absolute;
  //left: -40.9r/em;
  //top: -29.7rem;
  //width: 140.957rem;
  width:auto;
  height: 82.8rem;
  //border: 5.877rem solid #fff;
  box-sizing: border-box;
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

.count {
  position: absolute;
  left: 50%;
  top: 63.7rem;
  transform: translateX(-50%);
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-weight: 600;
  font-size: 20rem;
  color: #fff;
  letter-spacing: -0.8rem;
  line-height: 1.2;
  text-align: center;
  text-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.25);
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