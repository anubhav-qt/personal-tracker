import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Main function to get financial insights based on expense data
export async function getFinancialInsights(expenses: any[], customPrompt?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // System instructions for the AI
    const systemInstructions = `You are a very friendly and very knowledgable financial advisor who acts very professionally and friendly.
Use the provided expense data as context for your answers, but respond in a natural, conversational way.
When providing lists of recommendations or steps, always use numbered points (1., 2., 3., etc.) instead of bullet points.
Add a new line after each numbered point for clarity.`;

    // Default prompt if no custom prompt is provided
    const defaultPrompt = `Analyze these expenses and tell me where I've spent the most money. 
If there's enough data, identify any new spending habits formed in the last week or month.
Provide insights in a friendly, professional tone.`;

    // Construct full prompt
    const fullPrompt = `${systemInstructions}

User Expense Data:
${JSON.stringify(expenses, null, 2)}

${customPrompt || defaultPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting financial insights:', error);
    return "I'm having trouble analyzing your expenses right now. Please try again later.";
  }
}

// Function to get money-saving tips
export async function getSmartMoneyTips() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const tipsPrompt = `You are a very friendly and very knowledgable financial advisor.
Please provide 5 practical money-saving tips for everyday life.
Format each tip as a numbered point (1., 2., 3., etc.) with a short title in bold, followed by a brief explanation.
Make the tips actionable and specific.`;
    
    const result = await model.generateContent(tipsPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting smart money tips:', error);
    return 'Unable to generate money-saving tips at this time. Please try again later.';
  }
}