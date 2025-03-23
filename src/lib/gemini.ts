import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getExpenseInsights(expenses: any[], customPrompt?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = customPrompt || `Analyze these expenses and provide insights:
${JSON.stringify(expenses, null, 2)}

Please provide:
1. Spending patterns
2. Areas of potential savings
3. Budget recommendations
Keep it concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return 'Unable to generate insights at this time.';
  }
}