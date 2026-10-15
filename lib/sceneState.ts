import { finishes } from './content';

// GSAP ve DOM tarafından yazılan, R3F useFrame içinde okunan paylaşılan durum.
export const heroState = { length: 0, intro: 0, scroll: 0, pointerX: 0, pointerY: 0 };

export const productionState = {
  finish: finishes.ham,
  length: 5,
  die: 1,
};
