import { describe, it, expect } from 'vitest';
import {
  isContinuityOrPhoneDevice,
  pickBuiltInMicrophone,
} from '@/lib/microphone';

describe('microphone', () => {
  it('isContinuityOrPhoneDevice_ShouldDetectIphone', () => {
    expect(isContinuityOrPhoneDevice('iPhone 12 Microphone')).toBe(true);
    expect(isContinuityOrPhoneDevice('MacBook Pro Microphone')).toBe(false);
  });

  it('pickBuiltInMicrophone_ShouldPreferMacBook', () => {
    const devices = [
      { kind: 'audioinput', deviceId: '1', label: 'iPhone 11 Microphone' },
      { kind: 'audioinput', deviceId: '2', label: 'MacBook Pro Microphone (Built-in)' },
    ] as MediaDeviceInfo[];

    expect(pickBuiltInMicrophone(devices)?.deviceId).toBe('2');
  });

  it('pickBuiltInMicrophone_ShouldSkipContinuityDevices', () => {
    const devices = [
      { kind: 'audioinput', deviceId: '1', label: 'iPhone 12 Microphone (Continuity Camera)' },
      { kind: 'audioinput', deviceId: '2', label: 'External USB Mic' },
    ] as MediaDeviceInfo[];

    expect(pickBuiltInMicrophone(devices)?.deviceId).toBe('2');
  });
});
