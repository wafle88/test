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
