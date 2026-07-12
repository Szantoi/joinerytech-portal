import imageCompression from 'browser-image-compression';

/**
 * Compress a photo file for upload
 * Reduces file size and strips EXIF metadata (privacy)
 */
export async function compressPhoto(file: File): Promise<File> {
  const options = {
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg' as const
  };

  try {
    const compressed = await imageCompression(file, options);
    console.log(
      `Photo compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB`
    );
    return compressed;
  } catch (error) {
    console.error('Photo compression failed, using original:', error);
    return file; // Fallback to original if compression fails
  }
}
