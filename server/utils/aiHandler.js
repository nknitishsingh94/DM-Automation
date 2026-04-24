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

    // --- Provider Selection & Auto-Fallback ---
    const geminiKey = process.env.GEMINI_API_KEY;

    // Helper for OpenAI/Groq (Axios)
    const callOpenAI = async (client, modelName) => {
      const response = await client.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: `You are ${aiName}. Tone: ${aiTone}. Context: ${aiKnowledgeBase}. Keep replies very short.` },
          { role: "user", content: userMessage }
        ],
        temperature: aiTemperature,
        max_tokens: 350,
      });
      return response.choices[0]?.message?.content;
    };

    // Helper for Gemini Free API (Raw Axios - No SDK needed)
    const callGemini = async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`;
      const axios = (await import('axios')).default;
      
      try {
        const response = await axios.post(url, {
          contents: [{
              parts: [{ text: `System Instructions: You are ${aiName}. Tone: ${aiTone}. Context: ${aiKnowledgeBase}. Keep replies very short.\nUser: ${userMessage}` }]
          }],
          generationConfig: { temperature: Number(aiTemperature) || 0.7, maxOutputTokens: 350 }
        });
        
        const extractedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!extractedText) {
           console.error("GEMINI RETURNED NO TEXT. RAW PAYLOAD:", JSON.stringify(response.data));
           throw new Error(`GEMINI_DEBUG: No Text. Payload: ${JSON.stringify(response.data)}`);
        }
        return extractedText;
        
      } catch (err) {
        const exactError = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error("Gemini Exact Error:", exactError);
        throw new Error(`GEMINI_DEBUG: ${exactError}`);
      }
    };

    let reply;

    if (geminiKey) {
      console.log(`🚀 Trying Free Google Gemini API for user ${userId}...`);
      reply = await callGemini();
      if (reply) return reply;
    }

    throw new Error("No valid API Key found or API failed.");

  } catch (err) {
    console.error("❌ AI API Error:", err.message);
    // Explicitly return the raw error message to the Instagram DM for debugging
    return `RAW API ERROR: ${err.message}. Please check terminal for full details.`;
  }
};
