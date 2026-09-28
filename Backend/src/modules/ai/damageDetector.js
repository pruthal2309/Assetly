import { createHash } from 'node:crypto';
import { env } from '../../config/env.js';

export class MockDetector {
  async detect(imageBufferOrUrl) {
    const input = String(imageBufferOrUrl || 'default_seed');
    const hash = createHash('md5').update(input).digest('hex');
    const num = parseInt(hash.substring(0, 4), 16);

    const damageTypes = [
      'Pothole & Surface Crack',
      'Structural Spalling',
      'Corrosion & Rust',
      'Water Seepage',
      'Lamp Filament Burnout',
      'Drainage Blockage'
    ];
    const severities = ['low', 'medium', 'high', 'critical'];

    const damageType = damageTypes[num % damageTypes.length];
    const severity = severities[num % severities.length];
    const confidence = Number((0.75 + (num % 20) / 100).toFixed(2));

    return {
      status: 'success',
      damageType,
      severity,
      confidence,
      model: 'MockDamageVision-v1'
    };
  }
}

export class HostedVisionDetector {
  async detect(imageBufferOrUrl) {
    if (!env.VISION_API_KEY) {
      return new MockDetector().detect(imageBufferOrUrl);
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Perform vision API call...
      clearTimeout(timeoutId);
      return new MockDetector().detect(imageBufferOrUrl);
    } catch (err) {
      console.warn('Hosted vision detection failed or timed out:', err.message);
      return { status: 'unavailable', damageType: 'Unknown', severity: 'low', confidence: 0 };
    }
  }
}

export const getDamageDetector = () => {
  if (env.VISION_API_KEY) {
    return new HostedVisionDetector();
  }
  return new MockDetector();
};
