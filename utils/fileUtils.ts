import { Part, InlineDataPart } from "@google/genai";

/**
 * Converts a File object to a Data URL (base64 string with mime type prefix).
 * @param file The File object to convert.
 * @returns A Promise that resolves with the Data URL string.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a Data URL (base64 string with mime type prefix) back to a File object.
 * Handles malformed data URLs gracefully by creating a blank file.
 * @param dataUrl The Data URL string to convert.
 * @param filename The desired name for the new File.
 * @param mimeType The MIME type for the new File.
 * @returns A new File object.
 */
export const dataUrlToFile = (dataUrl: string, filename: string, mimeType: string): File => {
  const arr = dataUrl.split(',');
  if (arr.length < 2 || !arr[1]) {
    console.error(`Invalid data URL format for file "${filename}". A blank file will be created.`);
    return new File([], filename, { type: mimeType });
  }
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
};

/**
 * Converts a raw base64 string to a File object.
 * @param base64 The raw base64 string (without the "data:mime/type;base64," prefix).
 * @param filename The desired name for the new File.
 * @param mimeType The MIME type for the new File.
 * @returns A new File object.
 */
export function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Converts a File object into a generative part suitable for the Google Gemini API.
 * @param file The File object to convert.
 * @returns A Promise resolving to an object with inlineData for the API.
 */
export const fileToBase64Part = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string; } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      if (base64Data) {
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image file, resizing it and converting it to JPEG format.
 * @param file The image File object to compress.
 * @param quality The JPEG quality (0.0 to 1.0). Default is 0.8.
 * @param maxWidth The maximum width for the image. Default is 1280.
 * @param maxHeight The maximum height for the image. Default is 1280.
 * @returns A Promise that resolves with the compressed File object.
 */
export const compressImage = (file: File, quality = 0.8, maxWidth = 1280, maxHeight = 1280): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas is empty'));
            }
            // Create a new file with a modified name to indicate it's compressed
            const newFileName = `compressed_${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
            const newFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Type guard to check if a Part object is an InlineDataPart.
 * @param part The Part object to check.
 * @returns True if the part is an InlineDataPart, false otherwise.
 */
export function isInlineDataPart(part: Part): part is InlineDataPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    'inlineData' in part &&
    typeof (part as InlineDataPart).inlineData === 'object' &&
    (part as InlineDataPart).inlineData !== null &&
    'data' in (part as InlineDataPart).inlineData &&
    typeof ((part as InlineDataPart).inlineData).data === 'string' &&
    'mimeType' in (part as InlineDataPart).inlineData &&
    typeof ((part as InlineDataPart).inlineData).mimeType === 'string'
  );
}