export async function extractColorsFromImage(imageUrl: string): Promise<{
  primary: string;
  secondary: string;
  text: string;
  accent: string;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          primary: '#000000',
          secondary: '#1a1a1a',
          text: '#ffffff',
          accent: '#3b82f6'
        });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts: { [key: string]: number } = {};

      // Sample pixels at regular intervals
      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        
        // Convert to hex and count occurrences
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      // Sort colors by frequency
      const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([color]) => color)
        .filter(color => {
          const [r, g, b] = hexToRgb(color);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          return brightness > 20; // Filter out very dark colors
        });

      // Get the most prominent colors
      const primary = sortedColors[0] || '#000000';
      const secondary = sortedColors[1] || '#1a1a1a';
      const accent = sortedColors[2] || '#3b82f6';

      // Determine text color based on primary color brightness
      const [r, g, b] = hexToRgb(primary);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const text = brightness > 128 ? '#000000' : '#ffffff';

      resolve({ primary, secondary, text, accent });
    };

    img.onerror = () => {
      resolve({
        primary: '#000000',
        secondary: '#1a1a1a',
        text: '#ffffff',
        accent: '#3b82f6'
      });
    };

    // Handle CORS by using a proxy if needed
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    img.src = imageUrl.startsWith('data:') ? imageUrl : `${corsProxy}${imageUrl}`;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0];
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
} 