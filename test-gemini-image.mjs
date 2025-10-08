#!/usr/bin/env node

/**
 * Test script voor Google Gemini Image Generation
 * 
 * Dit script test of je Google Gemini setup correct werkt
 * voordat je deploy naar Vercel.
 * 
 * Gebruik:
 * 1. Zorg dat GOOGLE_GENERATIVE_AI_API_KEY is ingesteld in .env.local
 * 2. Run: node test-gemini-image.mjs
 */

import 'dotenv/config';
import { generateText } from 'ai';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Testing Google Gemini Image Generation...\n');

// Check for API key
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment variables');
  console.log('\n💡 Solution:');
  console.log('1. Add to your .env.local file:');
  console.log('   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here');
  console.log('2. Get your API key from: https://aistudio.google.com/');
  console.log('3. Restart this script\n');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
console.log('🚀 Generating image with Gemini 2.5 Flash...\n');

async function testGeminiImage() {
  try {
    const result = await generateText({
      model: 'google/gemini-2.5-flash-image-preview',
      providerOptions: {
        google: { responseModalities: ['TEXT', 'IMAGE'] },
      },
      prompt: 'Render a beautiful cosmic landscape with stars, galaxies, and nebulae in vibrant colors.',
    });

    console.log('📝 Text Response:', result.text || 'No text response');
    console.log('');

    // Check for images in response
    if (result.files && result.files.length > 0) {
      const imageFiles = result.files.filter((f) =>
        f.mediaType?.startsWith('image/'),
      );

      if (imageFiles.length > 0) {
        console.log(`✅ Success! Generated ${imageFiles.length} image(s)`);
        
        // Create output directory
        const outputDir = 'test-output';
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save images
        const timestamp = Date.now();
        for (const [index, file] of imageFiles.entries()) {
          const extension = file.mediaType?.split('/')[1] || 'png';
          const filename = `gemini-test-${timestamp}-${index}.${extension}`;
          const filepath = path.join(outputDir, filename);

          await fs.promises.writeFile(filepath, file.uint8Array);
          console.log(`💾 Saved: ${filepath}`);
          console.log(`   Size: ${(file.uint8Array.length / 1024).toFixed(2)} KB`);
          console.log(`   Type: ${file.mediaType}`);
        }

        console.log('');
        console.log('🎉 Test Successful!');
        console.log('✅ Gemini image generation is working correctly');
        console.log('✅ You can now deploy to Vercel');
      } else {
        console.log('⚠️  No image files found in response');
        console.log('Response files:', result.files);
      }
    } else {
      console.log('⚠️  No files in response');
      console.log('Full response:', JSON.stringify(result, null, 2));
    }

    // Show usage stats
    if (result.usage) {
      console.log('\n📊 Usage Statistics:');
      console.log(JSON.stringify(result.usage, null, 2));
    }

    // Show provider metadata
    if (result.providerMetadata) {
      console.log('\n🔧 Provider Metadata:');
      console.log(JSON.stringify(result.providerMetadata, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error during image generation:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Solution:');
      console.log('1. Verify your API key is correct');
      console.log('2. Get a new key from: https://aistudio.google.com/');
      console.log('3. Make sure the Generative Language API is enabled');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.log('\n💡 Solution:');
      console.log('1. Check your Google AI Studio quota');
      console.log('2. Free tier: 1500 requests per day');
      console.log('3. Wait and try again, or upgrade your account');
    } else if (error.message.includes('not found')) {
      console.log('\n💡 Solution:');
      console.log('1. Update AI SDK: npm update ai @ai-sdk/google');
      console.log('2. Verify model name is correct');
      console.log('3. Check if model is available in your region');
    } else {
      console.log('\n💡 Debug Info:');
      console.log('Error:', error);
    }
    
    process.exit(1);
  }
}

testGeminiImage();
