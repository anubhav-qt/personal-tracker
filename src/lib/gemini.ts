import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getExpenseInsights(expenses: any[], customPrompt?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build system message to frame the conversation
    const systemMessage = `You are a helpful financial assistant. Use the provided expense data as context for your answers, but respond in a natural, conversational way.
Don't format responses with prefixes like "Based on your data" or "According to your expenses".
Just be helpful, concise, and personalized.`;

    // Construct full prompt
    const fullPrompt = customPrompt ? 
      `${systemMessage}

User Expense Data Context (for your reference only):
${JSON.stringify(expenses.slice(0, 10), null, 2)}

User Question: ${customPrompt}` :
      
      `${systemMessage}

Please analyze these expenses and provide insights. Keep your response conversational and natural:
${JSON.stringify(expenses, null, 2)}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return 'Unable to generate insights at this time.';
  }
}

export async function getSmartSavingTips(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Enhance original prompt to request specific formatting
    const enhancedPrompt = `${prompt}
    
Important: Respond in a natural, conversational tone. When providing financial tips or advice:
- Present recommendations as concise bullet points
- Use short, clear sentences
- Avoid lengthy paragraphs
- Don't use phrases like "Based on your data" or "According to your expenses"
- Just give helpful financial insights directly`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting smart saving tips:', error);
    return 'Unable to generate personalized tips at this time.';
  }
}