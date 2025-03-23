import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getExpenseInsights(expenses: any[], customPrompt?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build system message to frame the conversation
    const systemMessage = `You are a helpful financial assistant. Use the provided expense data as context for your answers, but respond in a natural, conversational way.
Don't format responses with prefixes like "Based on your data" or "According to your expenses".
Just be helpful, concise, and personalized.
When providing lists of recommendations or steps, always use numbered points (1., 2., 3., etc.) instead of bullet points or asterisks.
Add a new line after each numbered point so they appear as separate paragraphs.`;

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
    
    // Enhance original prompt to request specific formatting with numbered lists
    const enhancedPrompt = `${prompt}
    
Important: Respond in a natural, conversational tone. When providing financial tips or advice:
1. Use numbered lists (1., 2., 3., etc.) instead of bullet points or asterisks
2. Format each point with a number followed by a period (like "1.")
3. Use short, clear sentences
4. Put a single blank line before the first numbered item
5. Do NOT put blank lines between numbered items - just a simple newline
6. Don't use markdown formatting like asterisks (*) or hyphens (-)
7. Don't use phrases like "Based on your data" or "According to your expenses"
8. Just give helpful financial insights directly using plain text

EXAMPLE FORMAT:
A short and friendly comment related to their expense data, then provide a list of tips:

1. First tip here in plain text.
2. Second tip here in plain text.
3. Third tip here in plain text.
4. Fourth tip here in plain text.`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting smart saving tips:', error);
    return 'Unable to generate personalized tips at this time.';
  }
}