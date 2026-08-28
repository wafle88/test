import { reactive } from 'vue';

export const flow = reactive({
  step: 1,
  pin: '',
  name: '',
  photo: '',
});

export function goTo(step) {
  flow.step = step;
}

export function next() {
  if (flow.step < 4) flow.step += 1;
}

export function prev() {
  if (flow.step > 1) flow.step -= 1;
}

// 손님이 도중에 자리를 뜨면 남은 입력이 다음 손님에게 보이지 않도록 지운다.
export function resetFlow() {
  flow.pin = '';
  flow.name = '';
  flow.photo = '';
}
