import { reactive } from 'vue';

export const flow = reactive({
  step: 1,
  pin: '',
  name: '',
});

export function goTo(step) {
  flow.step = step;
}

export function next() {
  if (flow.step < 8) flow.step += 1;
}

export function prev() {
  if (flow.step > 1) flow.step -= 1;
}
