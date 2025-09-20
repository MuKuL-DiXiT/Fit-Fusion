import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const generateSuggestions = async (prompt: string) => {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error generating suggestions from Gemini:', error);
    throw new Error('Failed to get suggestions from AI');
  }
};
