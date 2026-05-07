import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getSpendingInsights(transactions: Transaction[], userName: string, currencySymbol: string = '$') {
  if (!process.env.GEMINI_API_KEY) {
    return "AI Insights are currently unavailable. Please check your API key.";
  }

  if (transactions.length === 0) {
    return "Welcome, " + userName + "! Add some transactions to get AI-powered spending insights.";
  }

  const prompt = `
    You are a financial advisor for Aurelius Finance.
    User Name: ${userName}
    Current Currency: ${currencySymbol}
    Recent Transactions: ${JSON.stringify(transactions.slice(-20))}
    
    Based on the spending categories, amounts (in ${currencySymbol}), and frequency, provide 3 short, actionable bullet points for the user.
    Focus on:
    1. Identifying which category is consuming too much budget.
    2. Suggesting a specific saving strategy.
    3. A motivational comment.
    
    Keep it concise and professional. Use a supportive tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || "I'm analyzing your data. Check back in a moment!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI is currently resting. Please try again later.";
  }
}
