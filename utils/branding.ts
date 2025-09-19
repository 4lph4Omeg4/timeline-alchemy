export const applyBranding = (
    baseImageSrc: string,
    logoSrc: string | null,
    tagline: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';
        baseImage.onload = () => {
            const canvas = document.createElement('canvas');
            const quality = 0.92; // JPEG quality
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // 1. Draw base image
            ctx.drawImage(baseImage, 0, 0);

            // This function will draw the tagline. It's called after the logo is drawn (or alone if no logo).
            const drawTagline = () => {
                if (tagline) {
                    const padding = canvas.width * 0.025;
                    const fontSize = Math.max(12, Math.round(canvas.width / 60));
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    // Simple shadow for readability
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;

                    ctx.fillText(tagline, padding, canvas.height - padding);
                }
            };

            // 2. Draw logo (if provided)
            if (logoSrc) {
                const logoImage = new Image();
                logoImage.crossOrigin = 'anonymous';
                logoImage.onload = () => {
                    const padding = canvas.width * 0.025;
                    const maxWidth = canvas.width * 0.2; // Logo max width 20% of image width
                    const scale = Math.min(1, maxWidth / logoImage.width);
                    const logoWidth = logoImage.width * scale;
                    const logoHeight = logoImage.height * scale;
                    const x = canvas.width - logoWidth - padding;
                    const y = canvas.height - logoHeight - padding;

                    ctx.globalAlpha = 0.9; // Slight transparency for better blending
                    ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
                    ctx.globalAlpha = 1.0; // Reset alpha

                    // Draw tagline after logo to ensure correct layering if they were to overlap
                    drawTagline();

                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                logoImage.onerror = (err) => reject(new Error('Failed to load logo image.'));
                logoImage.src = logoSrc;
            } else {
                // No logo, just draw tagline
                drawTagline();
                resolve(canvas.toDataURL('image/jpeg', quality));
            }
        };
        baseImage.onerror = (err) => reject(new Error('Failed to load base image for branding.'));
        baseImage.src = baseImageSrc;
    });
};