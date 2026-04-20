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
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are ${aiName}, a DM Automation Agent. Tone: ${aiTone}. Context: ${aiKnowledgeBase}. Keep replies very short for direct messages. Provide helpful information if possible.` },
        { role: "user", content: userMessage }
      ],
      temperature: aiTemperature,
      max_tokens: 250,
    });

    return response.choices[0]?.message?.content || aiFallback;

  } catch (err) {
    console.error("❌ aiHandler Error:", err.message);
    return "I'm having trouble thinking right now. Please try again or leave a message.";
  }
};
