import { GoogleGenAI, Type } from "@google/genai";
import { ImageTask } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const imageTasks: ImageTask[] = [
    { id: 'blog1', title: 'Blog Image 1', aspectRatio: '16:9' },
    { id: 'blog2', title: 'Blog Image 2', aspectRatio: '16:9' },
    { id: 'insta', title: 'Instagram Post', aspectRatio: '1:1' },
    { id: 'tiktok', title: 'TikTok Post', aspectRatio: '9:16' },
    { id: 'linkedin', title: 'LinkedIn Post', aspectRatio: '1:1' },
    { id: 'facebook', title: 'Facebook Post', aspectRatio: '1:1' },
];

export const getPromptsFromBlogPost = async (blogPost: string, style: string): Promise<string[]> => {
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
            let prompts = jsonResponse.prompts || [];
            if (prompts.length > 6) {
                prompts = prompts.slice(0, 6);
            } else {
                while(prompts.length < 6) {
                    prompts.push(`A beautiful abstract image in a ${style} style`);
                }
            }
            console.warn("AI did not return exactly 6 prompts. Adjusted to 6.");
            return prompts;
        }

        return jsonResponse.prompts;

    } catch (error) {
        console.error("Error generating prompts:", error);
        throw new Error("Failed to generate image prompts from the blog post.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: '16:9' | '1:1' | '9:16', style: string): Promise<string> => {
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
