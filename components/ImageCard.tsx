import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import DownloadIcon from './icons/DownloadIcon';
import ShareIcon from './icons/ShareIcon';
import RegenerateIcon from './icons/RegenerateIcon';

interface ImageCardProps {
  image: GeneratedImage;
  onRegenerate: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onRegenerate }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const getAspectRatioClass = (aspectRatio: string) => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '1:1':
        return 'aspect-square';
      case '9:16':
        return 'aspect-[9/16]';
      default:
        return 'aspect-video';
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = image.src;
    const fileName = image.title.replace(/\s+/g, '_').toLowerCase();
    link.download = `${fileName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    setShareStatus('idle'); // Reset status on new attempt
    try {
      // Convert base64 to blob to create a File object
      const response = await fetch(image.src);
      const blob = await response.blob();
      const file = new File([blob], `${image.title.replace(/\s+/g, '_').toLowerCase()}.jpg`, { type: 'image/jpeg' });
      const shareData = {
          files: [file],
          title: image.title,
          text: `Check out this AI-generated image: ${image.title}`,
      };

      // Use Web Share API if available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && navigator.clipboard.write) {
        // Fallback: Copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/jpeg': blob }),
        ]);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } else {
        throw new Error("Share and Clipboard APIs are not supported.");
      }
    } catch (error) {
      // Don't show an alert for user-cancelled share dialogs
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Sharing failed:', error);
      setShareStatus('error');
      alert('Could not share or copy image. Your browser may not support this feature.');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-indigo-500/30">
      <img
        src={image.src}
        alt={image.title}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${getAspectRatioClass(image.aspectRatio)} ${image.isRegenerating ? 'blur-sm' : ''}`}
      />

      {image.isRegenerating && (
        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin"></div>
            <p className="text-gray-200 text-sm font-semibold">Creating...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-center">
        <h3 className="text-white text-lg font-bold drop-shadow-lg">{image.title}</h3>
        <div className="flex items-center gap-2">
            <button
                onClick={onRegenerate}
                disabled={image.isRegenerating}
                className="p-2 rounded-full bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-wait"
                aria-label={`Regenerate ${image.title}`}
                title="Regenerate Image"
            >
                <RegenerateIcon className="h-5 w-5" />
            </button>
            <button
                onClick={handleShare}
                disabled={image.isRegenerating}
                className="p-2 rounded-full bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center min-w-[36px] min-h-[36px] disabled:opacity-50"
                aria-label={`Share ${image.title}`}
                title="Share or Copy Image"
            >
                {shareStatus === 'copied' ? (
                    <span className="text-xs font-semibold">Copied!</span>
                ) : (
                    <ShareIcon className="h-5 w-5" />
                )}
            </button>
            <button
                onClick={downloadImage}
                disabled={image.isRegenerating}
                className="p-2 rounded-full bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                aria-label={`Download ${image.title}`}
                title="Download Image"
            >
                <DownloadIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;