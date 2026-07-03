/*
  Microphone helpers for voice input.

  Web Speech API cannot pick an input device — on macOS it may route audio
  to a nearby iPhone via Continuity Camera. We acquire an explicit MediaStream
  from the built-in Mac microphone instead.
*/

export function isContinuityOrPhoneDevice(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes('iphone') ||
    lower.includes('ipad') ||
    lower.includes('continuity')
  );
}

export function pickBuiltInMicrophone(
  devices: MediaDeviceInfo[],
): MediaDeviceInfo | undefined {
  const inputs = devices.filter((d) => d.kind === 'audioinput');
  const local = inputs.filter((d) => !isContinuityOrPhoneDevice(d.label));

  const builtIn = local.find((d) => {
    const l = d.label.toLowerCase();
    return (
      l.includes('built-in') ||
      l.includes('macbook') ||
      l.includes('internal') ||
      l.includes('встроен')
    );
  });
  if (builtIn) return builtIn;

  return local[0];
}

export type MicrophoneErrorCode = 'NOT_SUPPORTED' | 'NO_MIC' | 'CONTINUITY_ONLY';

export class MicrophoneError extends Error {
  constructor(public readonly code: MicrophoneErrorCode) {
    super(code);
    this.name = 'MicrophoneError';
  }
}

export async function acquireBuiltInMicrophoneStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new MicrophoneError('NOT_SUPPORTED');
  }

  let devices = await navigator.mediaDevices.enumerateDevices();
  let mic = pickBuiltInMicrophone(devices);

  if (!mic?.label) {
    const warmup = await navigator.mediaDevices.getUserMedia({ audio: true });
    warmup.getTracks().forEach((track) => track.stop());
    devices = await navigator.mediaDevices.enumerateDevices();
    mic = pickBuiltInMicrophone(devices);
  }

  if (!mic) {
    const hasPhoneMic = devices.some(
      (d) => d.kind === 'audioinput' && isContinuityOrPhoneDevice(d.label),
    );
    throw new MicrophoneError(hasPhoneMic ? 'CONTINUITY_ONLY' : 'NO_MIC');
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: mic.deviceId },
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}

export function pickRecorderMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

export function releaseMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* already stopped */
    }
  });
}
