/*
  Client-side image compression via Canvas API.

  Resizes the photo so its longest side is at most MAX_SIDE pixels,
  then re-encodes as JPEG at 80% quality.  This keeps Gemini payloads
  small while retaining enough detail for food recognition.

  Returns a raw base64 string (no data-URL prefix).
*/

const MAX_SIDE = 800;

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > MAX_SIDE) {
        height = (height * MAX_SIDE) / width;
        width = MAX_SIDE;
      } else if (height > MAX_SIDE) {
        width = (width * MAX_SIDE) / height;
        height = MAX_SIDE;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      // Strip "data:image/jpeg;base64," prefix
      const rawBase64 = base64.split(',')[1];

      resolve(rawBase64);
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = objectUrl;
  });
}
