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
    
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!groqKey && !openaiKey) {
      console.warn("⚠️ No AI API Keys configured in env.");
      return userSettings?.aiFallbackMessage || "I'm currently in limited mode, please contact support.";
    }

    const aiName = userSettings?.aiName || "Zen Assistant";
    const aiTone = userSettings?.aiTone || "friendly and concise";
    const aiKnowledgeBase = userSettings?.aiKnowledgeBase || "You are an AI helpful assistant.";
    const aiTemperature = userSettings?.aiTemperature !== undefined ? userSettings.aiTemperature : 0.7;

    // --- Provider Selection ---
    let client;
    let modelName;

    if (groqKey) {
      // Use Groq (Free / Fast)
      client = new OpenAI({ 
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1"
      });
      modelName = "llama3-8b-8192"; // Super fast, high-limit free model
      console.log(`🚀 Using Groq for user ${userId}`);
    } else {
      // Fallback to OpenAI
      client = new OpenAI({ apiKey: openaiKey });
      modelName = "gpt-4o-mini";
      console.log(`🤖 Using OpenAI for user ${userId}`);
    }

    // --- Human Escalation Check ---
    const keywords = ["angry", "stupid", "human", "manager", "stolen", "scam"];
    const needsEscalation = keywords.some(k => userMessage.toLowerCase().includes(k));
    if (userSettings?.aiHumanEscalation && needsEscalation) {
       return "I understand you might be frustrated. Let me escalate this to my human manager right away.";
    }

    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: `You are ${aiName}. Tone: ${aiTone}. Context: ${aiKnowledgeBase}. Keep replies very short.` },
        { role: "user", content: userMessage }
      ],
      temperature: aiTemperature,
      max_tokens: 350,
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) throw new Error("Empty response from AI Provider");
    return reply;

  } catch (err) {
    console.error("❌ AI API Error:", err.message);
    
    if (err.message?.includes('401')) return "AI Error: Invalid API Key.";
    if (err.message?.includes('429')) return "AI Error: Rate limit or Quota exceeded.";

    return "I'm having trouble thinking right now. (Internal: " + (err.message || "Unknown error") + ")";
  }
};
