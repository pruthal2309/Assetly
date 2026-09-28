import { getDamageDetector } from './damageDetector.js';

export const analyzeDamage = async (imageInput) => {
  const detector = getDamageDetector();
  return detector.detect(imageInput);
};
