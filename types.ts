
export interface GeneratedImage {
  id: string;
  title: string;
  src: string;
  aspectRatio: '16:9' | '1:1' | '9:16';
  isRegenerating?: boolean;
}

export interface ImageTask {
    id: string;
    title: string;
    aspectRatio: '16:9' | '1:1' | '9:16';
}
