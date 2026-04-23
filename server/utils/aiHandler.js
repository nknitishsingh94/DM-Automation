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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      // Import axios dynamically if not present (but we assume it is since index uses it, wait, we need to import it at the top. Let's assume axios is in scope or we require it).
      const axios = (await import('axios')).default;
      const response = await axios.post(url, {
        contents: [{
            parts: [{ text: `System Instructions: You are ${aiName}. Tone: ${aiTone}. Context: ${aiKnowledgeBase}. Keep replies very short.\nUser: ${userMessage}` }]
        }],
        generationConfig: { temperature: aiTemperature, maxOutputTokens: 350 }
      });
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    };

    let reply;

    // Try Gemini First (100% Free & Generous Limits)
    if (geminiKey) {
      try {
        console.log(`🚀 Trying Free Google Gemini API for user ${userId}...`);
        reply = await callGemini();
      } catch (err) {
        console.warn(`⚠️ Gemini API Failed (${err.message}). Falling back...`);
      }
    }

    // Try Groq Second
    if (!reply && groqKey) {
      try {
        const groqClient = new OpenAI({ apiKey: groqKey, baseURL: "https://api.groq.com/openai/v1" });
        console.log(`🚀 Trying Groq API for user ${userId}...`);
        reply = await callOpenAI(groqClient, "llama3-8b-8192");
      } catch (err) {
        console.warn(`⚠️ Groq API Failed (${err.message}). Falling back...`);
      }
    }

    // Fallback to OpenAI
    if (!reply && openaiKey) {
      try {
        const openaiClient = new OpenAI({ apiKey: openaiKey });
        console.log(`🤖 Trying OpenAI API for user ${userId}...`);
        reply = await callOpenAI(openaiClient, "gpt-4o-mini");
      } catch (err) {
         console.error(`⚠️ OpenAI API also failed:`, err.message);
         throw err; 
      }
    }

    if (!reply) throw new Error("Empty response from AI Providers");
    return reply;

  } catch (err) {
    console.error("❌ AI API Error:", err.message);
    
    if (err.message?.includes('401')) return "AI Error: Invalid API Key.";
    if (err.message?.includes('429')) return "AI Error: Rate limit or Quota exceeded.";

    return "I'm having trouble thinking right now. (Internal: " + (err.message || "Unknown error") + ")";
  }
};
