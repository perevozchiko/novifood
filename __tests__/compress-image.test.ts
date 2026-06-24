import { describe, it, expect, vi, afterEach } from 'vitest';
import { compressImage } from '@/lib/compress-image';

/*
  Unit tests for compressImage utility.

  Image, Canvas, and URL.createObjectURL do not exist in jsdom/Node,
  so we provide class-based mocks that trigger onload / onerror.
*/

const mockCtx = { drawImage: vi.fn() };
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,abc123'),
};

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return mockCanvas as unknown as HTMLElement;
    // Delegate non-canvas elements to the real implementation
    return document.createElement.call(document, tag);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('compressImage', () => {
  it('compressImage_ShouldResolveWithBase64_WhenImageLoadsSuccessfully', async () => {
    class MockImageLoad {
      width = 400;
      height = 300;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_url: string) {
        // Trigger onload asynchronously
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal('Image', MockImageLoad);

    const fakeFile = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImage(fakeFile);
    expect(result).toBe('abc123');
  });

  it('compressImage_ShouldReject_WhenImageFailsToLoad', async () => {
    class MockImageError {
      width = 0;
      height = 0;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_url: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    vi.stubGlobal('Image', MockImageError);

    const fakeFile = new File(['data'], 'bad.jpg', { type: 'image/jpeg' });
    await expect(compressImage(fakeFile)).rejects.toThrow('Failed to load image');
  });
});
