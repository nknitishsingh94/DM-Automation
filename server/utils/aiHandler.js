import OpenAI from 'openai';
import Settings from '../models/Settings.js';

/**
 * Centralized AI Response Generator
 * @param {string} userId - ID of the user owning the bot
 * @param {string} userMessage - The text received from the customer
 * @returns {Promise<string>} - The AI generated response text
 */
export const generateAIResponse = async (userId, userMessage) => {
  // Force reload env for robustness
  const dotenvModule = await import('dotenv');
  dotenvModule.default.config();

  try {
    const userSettings = await Settings.findOne({ userId });
    
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    console.log(`🔍 AI DEBUG: Groq:${!!groqKey}, OpenAI:${!!openaiKey}, Gemini:${!!geminiKey}`);

    if (!groqKey && !openaiKey) {
      console.warn("⚠️ No AI API Keys configured in env.");
      return userSettings?.aiFallbackMessage || "I'm currently in limited mode, please contact support.";
    }

    const aiName = userSettings?.aiName || "Zen Assistant";
    const aiTone = userSettings?.aiTone || "friendly and concise";
    const aiKnowledgeBase = userSettings?.aiKnowledgeBase || "You are an AI helpful assistant.";
    const aiTemperature = userSettings?.aiTemperature !== undefined ? userSettings.aiTemperature : 0.7;

    // --- Provider Selection & Auto-Fallback ---

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
      const versions = ['v1beta', 'v1'];
      const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-1.5-flash', 'gemini-pro'];
      const axios = (await import('axios')).default;
      let lastError;

      for (const version of versions) {
        for (const modelName of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${geminiKey}`;
            console.log(`🤖 [AI DEBUG] Trying ${version} with ${modelName}...`);
            
            const response = await axios.post(url, {
              contents: [{
                  parts: [{ text: `System Instructions: You are ${aiName}. Tone: ${aiTone}. Context: ${aiKnowledgeBase}. Keep replies very short.\nUser: ${userMessage}` }]
              }],
              generationConfig: { temperature: Number(aiTemperature) || 0.7, maxOutputTokens: 350 }
            });
            
            const extractedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (extractedText) {
              console.log(`✅ Success with ${version}/${modelName}!`);
              return extractedText;
            }
            
          } catch (err) {
            lastError = err.response?.data ? JSON.stringify(err.response.data) : err.message;
          }
        }
      }
      
      console.error("Gemini All Combinations Failed. Running Diagnostics...");
      try {
        const diagUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
        const diagResp = await axios.get(diagUrl);
      throw new Error(`GEMINI_DEBUG: ${lastError}`);
    };

    // --- Provider Selection (Prioritizing Working Gemini) ---
    let reply = null;

    // 1. Try Gemini (Diagnostic-approved working models)
    if (geminiKey) {
      console.log(`🚀 Trying Gemini for user ${userId}...`);
      try {
        reply = await callGemini();
        if (reply) {
          console.log(`✅ Success with Gemini!`);
          return reply;
        }
      } catch (err) {
        console.error("Gemini Primary Failed:", err.message);
      }
    }

    // 2. Try Groq (High-speed Llama backup)
    if (groqKey) {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
      const cleanGroqKey = groqKey.trim();
      
      for (const groqModel of groqModels) {
        console.log(`🚀 Trying Groq (${groqModel}) as backup...`);
        try {
          const groq = new OpenAI({ apiKey: cleanGroqKey, baseURL: "https://api.groq.com/openai/v1" });
          reply = await callOpenAI(groq, groqModel);
          if (reply) {
            console.log(`✅ Success with Groq fallback: ${groqModel}`);
            return reply;
          }
        } catch (err) {
          console.error(`Groq (${groqModel}) Failed:`, err.message);
          if (err.status === 401) break;
        }
      }
    }

    console.error("❌ AI API Error: All active services failed.");
    return userSettings?.aiFallbackMessage || "I'm currently in limited mode, please contact support.";

  } catch (err) {
    console.error("❌ AI API Error:", err.message);
    
    // Fetch fallback message again in catch block
    const finalSettings = await Settings.findOne({ userId });
    return finalSettings?.aiFallbackMessage || "I'm currently busy, please try again in a bit! 😊";
  }
};
