import React, { useState, useCallback } from 'react';
import { GeneratedImage } from './types';
import { imageTasks, getPromptsFromBlogPost, generateImage } from './services/geminiService';
import { applyBranding } from './utils/branding';
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
  const [prompts, setPrompts] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [logo, setLogo] = useState<string | null>(null);
  const [tagline, setTagline] = useState<string>('');
  const [step, setStep] = useState<'input' | 'prompts' | 'results'>('input');

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleStartOver = () => {
    setBlogPost('');
    setGeneratedImages([]);
    setPrompts([]);
    setError(null);
    setStep('input');
    // Keep branding intact for next use
  };

  const handleGeneratePrompts = useCallback(async () => {
    if (!blogPost.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setPrompts([]);
    setLoadingMessage(`Analyzing blog post for prompts...`);

    try {
      const generatedPrompts = await getPromptsFromBlogPost(blogPost, selectedStyle);
      setPrompts(generatedPrompts);
      setStep('prompts');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate prompts: ${errorMessage}`);
      setStep('input');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [blogPost, isLoading, selectedStyle]);

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const handleGenerateImages = useCallback(async () => {
    if (prompts.length !== imageTasks.length || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setStep('results'); // Move to results view immediately to show loader there

    try {
        const generationPromises = imageTasks.map((task, index) => {
            setLoadingMessage(`Generating ${task.title}...`);
            return generateImage(prompts[index], task.aspectRatio, selectedStyle)
                .then(async (src) => {
                    const brandedSrc = (logo || tagline) ? await applyBranding(src, logo, tagline) : src;
                    return {
                        ...task,
                        src: brandedSrc,
                    };
                });
        });
        
        const results = await Promise.all(generationPromises);
        setGeneratedImages(results);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Generation failed: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [prompts, isLoading, selectedStyle, logo, tagline]);

  const handleRegenerateImage = useCallback(async (imageIndex: number) => {
    const imageToRegen = generatedImages[imageIndex];
    if (!imageToRegen || imageToRegen.isRegenerating) return;

    setGeneratedImages(currentImages =>
      currentImages.map((img, idx) =>
        idx === imageIndex ? { ...img, isRegenerating: true } : img
      )
    );
    setError(null);

    try {
      const task = imageTasks[imageIndex];
      const prompt = prompts[imageIndex];
      const newSrc = await generateImage(prompt, task.aspectRatio, selectedStyle);
      const brandedSrc = (logo || tagline) ? await applyBranding(newSrc, logo, tagline) : newSrc;
      
      setGeneratedImages(currentImages =>
        currentImages.map((img, idx) =>
          idx === imageIndex ? { ...img, src: brandedSrc, isRegenerating: false } : img
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Regeneration failed for ${imageToRegen.title}: ${errorMessage}`);
      console.error(err);
      setGeneratedImages(currentImages =>
        currentImages.map((img, idx) =>
          idx === imageIndex ? { ...img, isRegenerating: false } : img
        )
      );
    }
  }, [generatedImages, prompts, selectedStyle, logo, tagline]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D0C14] to-black text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="text-center mb-12">
           <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Cosmic Content Creator
            </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Paste your blog post, choose your style, and we'll summon six images from the cosmos, perfectly sized for your content.
          </p>
        </header>

        <main>
          {step === 'input' && !isLoading && (
            <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl shadow-black/20 border border-gray-700">
              <textarea
                value={blogPost}
                onChange={(e) => setBlogPost(e.target.value)}
                placeholder="Paste your blog post here..."
                className="w-full h-48 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
                disabled={isLoading}
              />
              <div className="mt-6 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Branding Kit (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-400 mb-2">Logo Overlay</label>
                    <div className="flex items-center gap-4">
                      <label htmlFor="logo-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors duration-200">Upload Logo</label>
                      <input id="logo-upload" type="file" className="hidden" accept="image/png" onChange={handleLogoUpload} disabled={isLoading}/>
                      {logo && <img src={logo} alt="Logo Preview" className="h-10 w-auto bg-white/10 p-1 rounded" />}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="tagline-input" className="block text-sm font-medium text-gray-400 mb-2">Tagline / URL</label>
                    <input id="tagline-input" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. yourwebsite.com" className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" disabled={isLoading}/>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="style-select" className="block text-sm font-medium text-gray-400 mb-2">Choose Your Style</label>
                  <select id="style-select" value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} disabled={isLoading} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 appearance-none" style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem'}}>
                    {styleOptions.map((group) => (<optgroup key={group.category} label={group.category} className="bg-gray-800 text-gray-300">{group.styles.map((style) => (<option key={style} value={style} className="bg-gray-900 hover:bg-gray-700">{style}</option>))}</optgroup>))}
                  </select>
                </div>
                <button onClick={handleGeneratePrompts} disabled={isLoading || !blogPost.trim()} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-lg transition-colors duration-200 ease-in-out hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900">
                  <SparklesIcon className="h-5 w-5" />
                  Analyze & Create Prompts
                </button>
              </div>
            </div>
          )}

          {step === 'prompts' && !isLoading && (
            <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl shadow-black/20 border border-gray-700 animate-[fadeIn_0.5s_ease-in-out]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-200">Review & Edit Prompts</h2>
                    <button onClick={() => setStep('input')} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">&larr; Back to Editor</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prompts.map((prompt, index) => (
                        <div key={imageTasks[index].id}>
                            <label htmlFor={`prompt-${index}`} className="block text-sm font-medium text-gray-400 mb-1">{imageTasks[index].title} ({imageTasks[index].aspectRatio})</label>
                            <textarea id={`prompt-${index}`} value={prompt} onChange={(e) => handlePromptChange(index, e.target.value)} rows={4} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-y"/>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                    <button onClick={handleGenerateImages} className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-lg transition-colors duration-200 ease-in-out hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900">
                        <SparklesIcon className="h-5 w-5" />
                        Generate Images
                    </button>
                </div>
            </div>
          )}

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

          {step === 'results' && !isLoading && generatedImages.length > 0 && (
            <div className="mt-12 animate-[fadeIn_0.5s_ease-in-out]">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-200">Your Cosmic Creations</h2>
                    <button onClick={handleStartOver} className="mt-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300">Start Over &rarr;</button>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedImages.map((img, index) => (
                        <ImageCard key={img.id} image={img} onRegenerate={() => handleRegenerateImage(index)} />
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