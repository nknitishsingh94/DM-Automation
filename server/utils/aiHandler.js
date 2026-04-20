import OpenAI from 'openai';
import Settings from '../models/Settings.js';

/**
 * Centralized AI Response Generator
 * @param {string} userId - ID of the user owning the bot
 * @param {string} userMessage - The text received from the customer
 * @returns {Promise<string>} - The AI generated response text
 */
export const generateAIResponse = async (userId, userMessage) => {
  try {
    const userSettings = await Settings.findOne({ userId });
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OpenAI Key not configured in env.");
      return userSettings?.aiFallbackMessage || "I'm currently in limited mode, please contact support.";
    }

    const aiName = userSettings?.aiName || "Zen Assistant";
    const aiTone = userSettings?.aiTone || "friendly and concise";
    const aiKnowledgeBase = userSettings?.aiKnowledgeBase || "You are an AI helpful assistant.";
    const aiTemperature = userSettings?.aiTemperature !== undefined ? userSettings.aiTemperature : 0.7;
    const aiFallback = userSettings?.aiFallbackMessage || "I'm not exactly sure, let me connect you to a human.";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Check for Human Escalation intent (Basic check)
    const keywords = ["angry", "stupid", "human", "manager", "stolen", "scam"];
    const needsEscalation = keywords.some(k => userMessage.toLowerCase().includes(k));

    if (userSettings?.aiHumanEscalation && needsEscalation) {
       return "I understand you might be frustrated. Let me escalate this to my human manager right away. They will reply shortly.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Most reliable and available model
      messages: [
        { role: "system", content: `You are ${aiName}. Tone: ${aiTone}. Context: ${aiKnowledgeBase}.` },
        { role: "user", content: userMessage }
      ],
      temperature: aiTemperature,
      max_tokens: 300,
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) throw new Error("Empty response from OpenAI");
    return reply;

  } catch (err) {
    console.error("❌ OpenAI API Error:", err.response?.data || err.message);
    
    // Check for specific common errors to guide the user
    if (err.message?.includes('401') || err.message?.includes('auth')) {
      return "AI Connection Error: Check if your OpenAI API Key is valid and active.";
    }
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return "AI Quota Error: Your OpenAI account seems to have $0 balance. Please add credits.";
    }

    return "I'm having trouble thinking right now. (Internal: " + (err.message || "Unknown error") + ")";
  }
};
