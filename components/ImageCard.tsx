
import React from 'react';
import { GeneratedImage } from '../types';
import DownloadIcon from './icons/DownloadIcon';

interface ImageCardProps {
  image: GeneratedImage;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
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
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-slate-800 shadow-lg transition-all duration-300 hover:shadow-cyan-500/30">
      <img
        src={image.src}
        alt={image.title}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${getAspectRatioClass(image.aspectRatio)}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-center">
        <h3 className="text-white text-lg font-bold drop-shadow-lg">{image.title}</h3>
        <button
          onClick={downloadImage}
          className="p-2 rounded-full bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label={`Download ${image.title}`}
        >
          <DownloadIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ImageCard;
