import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not defined in the environment variables.');
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export const generateSuggestions = async (prompt: string) => {
  let text = '';
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    text = await response.text();
    
    console.log('Raw Gemini response:', text);
    
    // Clean the response to extract JSON from markdown code blocks
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*\n?/, '').replace(/\n?\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*\n?/, '').replace(/\n?\s*```$/, '');
    }
    
    console.log('Cleaned text for parsing:', cleanedText);
    
    // Try to parse the cleaned JSON
    const parsedResponse = JSON.parse(cleanedText);
    console.log('Successfully parsed JSON:', parsedResponse);
    
    return parsedResponse;
  } catch (error) {
    console.error('Error generating suggestions from Gemini:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed. Raw text length:', text?.length);
      console.error('First 200 characters:', text?.substring(0, 200));
      console.error('Last 200 characters:', text?.substring(Math.max(0, text.length - 200)));
    }
    throw new Error('Failed to get suggestions from AI - invalid JSON format. Check console for details.');
  }
};
