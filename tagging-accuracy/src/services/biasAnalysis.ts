import { BiasAnalysisResult, BiasImageInput } from '../types/bias';

/**
 * Demonstration adapter. Replace the body of this function with a call to the
 * clothing-recognition evaluation API while keeping the component contract.
 */
export async function analyzeBiasImage(_image: BiasImageInput): Promise<BiasAnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  return {
    isDemo: true,
    fairnessScore: 78,
    summary:
      'The outfit was recognized consistently, but confidence may be lower for layered garments and darker lighting conditions.',
    findings: [
      {
        id: 'garment',
        label: 'Garment tagging',
        status: 'balanced',
        detail: 'Primary outfit pieces were identified without a notable disparity signal.',
      },
      {
        id: 'lighting',
        label: 'Lighting sensitivity',
        status: 'watch',
        detail: 'Low contrast around the outer layer may reduce recognition confidence.',
      },
    ],
    recommendations: [
      'Use evenly lit, full-body photos with the outfit clearly visible.',
      'Include more layered looks and varied skin tones in future evaluation sets.',
    ],
  };
}

