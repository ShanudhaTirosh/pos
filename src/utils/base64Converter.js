/**
 * Converts a File object to a Base64 string.
 * Includes optional canvas-based resizing/compression to stay within Firestore limits.
 * @param {File} file 
 * @param {Object} options { maxWidth, maxHeight, quality }
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file, options = { maxWidth: 500, maxHeight: 500, quality: 0.7 }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > options.maxWidth) {
            height *= options.maxWidth / width;
            width = options.maxWidth;
          }
        } else {
          if (height > options.maxHeight) {
            width *= options.maxHeight / height;
            height = options.maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality reduction
        const dataUrl = canvas.toDataURL('image/jpeg', options.quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
