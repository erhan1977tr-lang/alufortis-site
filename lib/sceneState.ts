import { finishes } from './content';

// GSAP ve DOM tarafından yazılan, R3F useFrame içinde okunan paylaşılan durum.
export const productionState = {
  finish: finishes.ham,
  length: 5,
  die: 1,
};
