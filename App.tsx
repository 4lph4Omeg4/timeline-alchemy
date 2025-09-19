import React, { useState, useCallback } from 'react';
import { GeneratedImage } from './types';
import { generateAllImages } from './services/geminiService';
import SparklesIcon from './components/icons/SparklesIcon';
import Loader from './components/Loader';
import ImageCard from './components/ImageCard';

const styleOptions = [
  {
    category: '🌌 Cosmic & Futuristic',
    styles: [
      'Cosmic Neon',
      'Cyberpunk Cityscape',
      'Galactic Fractals',
      'Quantum Grid / Hologram',
    ],
  },
  {
    category: '🌱 Natural & Earthy',
    styles: [
      'Sacred Geometry Nature',
      'Elemental Abstract Art',
      'Crystal & Mineral Vibes',
    ],
  },
  {
    category: '🎨 Artistic & Minimal',
    styles: [
      'Pastel Dreamscape',
      'Retro Vaporwave',
      'Clean Gradient Shapes',
      'Ink & Brush Spiritual Style',
    ],
  },
  {
    category: '🔥 Premium / High-impact',
    styles: [
      'Mythic Archetypes',
      'Ancient Futurism',
      'Golden Ratio Luxe',
    ],
  },
];

const App: React.FC = () => {
  const [blogPost, setBlogPost] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('Cosmic Neon');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleGenerate = useCallback(async () => {
    if (!blogPost.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    
    try {
      const images = await generateAllImages(blogPost, setLoadingMessage, selectedStyle);
      setGeneratedImages(images);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [blogPost, isLoading, selectedStyle]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 p-1 rounded-xl">
              <div className="bg-slate-900 rounded-lg px-4 py-2">
                 <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-cyan-400">
                    Cosmic Content Creator
                  </h1>
              </div>
          </div>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Paste your blog post, choose your style, and we'll summon six images from the cosmos, perfectly sized for your content.
          </p>
        </header>

        <main>
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-2xl shadow-black/20 border border-slate-700">
            <textarea
              value={blogPost}
              onChange={(e) => setBlogPost(e.target.value)}
              placeholder="Paste your blog post here..."
              className="w-full h-48 p-4 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none"
              disabled={isLoading}
            />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="style-select" className="block text-sm font-medium text-slate-400 mb-2">
                        Choose Your Style
                    </label>
                    <select
                        id="style-select"
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        disabled={isLoading}
                        className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 appearance-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem',
                        }}
                    >
                        {styleOptions.map((group) => (
                            <optgroup key={group.category} label={group.category} className="bg-slate-800 text-slate-300">
                                {group.styles.map((style) => (
                                    <option key={style} value={style} className="bg-slate-900 hover:bg-slate-700">
                                        {style}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !blogPost.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    <SparklesIcon className="h-5 w-5" />
                    {isLoading ? 'Generating...' : 'Generate Images'}
                </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mt-8">
              <Loader message={loadingMessage} />
            </div>
          )}

          {generatedImages.length > 0 && !isLoading && (
            <div className="mt-12">
                <h2 className="text-3xl font-bold text-center mb-8 text-slate-200">Your Cosmic Creations</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedImages.map((img) => (
                        <ImageCard key={img.title} image={img} />
                    ))}
                </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default App;
