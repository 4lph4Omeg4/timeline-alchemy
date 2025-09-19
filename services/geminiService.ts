import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedImage, ImageTask } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const imageTasks: ImageTask[] = [
    { title: 'Blog Image 1', aspectRatio: '16:9' },
    { title: 'Blog Image 2', aspectRatio: '16:9' },
    { title: 'Instagram Post', aspectRatio: '1:1' },
    { title: 'TikTok Post', aspectRatio: '9:16' },
    { title: 'LinkedIn Post', aspectRatio: '1:1' },
    { title: 'Facebook Post', aspectRatio: '1:1' },
];

const getPromptsFromBlogPost = async (blogPost: string, style: string): Promise<string[]> => {
    const prompt = `
        Based on the following blog post, generate exactly 6 distinct, concise, and visually descriptive prompts for an image generation AI.
        Each prompt should capture a key theme, subject, or moment from the text.
        It is absolutely essential that every single prompt describes a scene in a "${style}" style.
        Do not just list objects; describe a dynamic scene.

        Blog Post:
        ---
        ${blogPost}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "A visually descriptive prompt for image generation.",
                            },
                            description: "An array of exactly 6 image generation prompts.",
                        },
                    },
                    required: ["prompts"],
                },
            },
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (!jsonResponse.prompts || jsonResponse.prompts.length !== 6) {
            throw new Error("AI did not return 6 prompts.");
        }

        return jsonResponse.prompts;

    } catch (error) {
        console.error("Error generating prompts:", error);
        throw new Error("Failed to generate image prompts from the blog post.");
    }
};

const generateImage = async (prompt: string, aspectRatio: '16:9' | '1:1' | '9:16', style: string): Promise<string> => {
    const fullPrompt = `${prompt}, ${style}, hyper-detailed, epic lighting`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed, no images returned.");
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateAllImages = async (
    blogPost: string, 
    updateLoadingMessage: (message: string) => void,
    style: string
): Promise<GeneratedImage[]> => {
    updateLoadingMessage(`Analyzing blog post for ${style} prompts...`);
    const prompts = await getPromptsFromBlogPost(blogPost, style);

    const generationPromises = imageTasks.map((task, index) => {
        return generateImage(prompts[index], task.aspectRatio, style)
            .then(src => {
                 updateLoadingMessage(`Generating ${task.title}...`);
                 return {
                    ...task,
                    src,
                };
            });
    });
    
    const results = await Promise.all(generationPromises);
    updateLoadingMessage("All images generated!");
    return results;
};
