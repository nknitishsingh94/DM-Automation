import express from 'express';
import OpenAI from 'openai';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OpenAI API key not configured in .env file. Please add OPENAI_API_KEY.");
    }
    return new OpenAI({ apiKey });
};

router.post('/generate', verifyToken, async (req, res) => {
    try {
        const { prompt, type } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        let systemMessage = "You are an expert marketing AI assistant. Your goal is to write high-converting, friendly, and engaging direct messages and button texts for automation flows.";
        let userMessage = prompt;

        if (type === 'message') {
             userMessage = `Generate a friendly, concise direct message based on this prompt: "${prompt}". Do not use quotes around the response. Keep it under 200 characters if possible.`;
        } else if (type === 'buttons') {
             userMessage = `Generate 2-3 short button texts (1-3 words each) based on this prompt: "${prompt}". Return them as a comma-separated list.`;
        } else if (type === 'keywords') {
             userMessage = `Generate 3-5 short, single-word or two-word keywords for an automation trigger based on this prompt: "${prompt}". Return them as a comma-separated list without quotes.`;
        }

        const groqKey = process.env.GROQ_API_KEY;
        let generatedText = '';

        try {
            const openai = getOpenAIClient();
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 150
            });
            generatedText = response.choices[0].message.content.trim();
        } catch (openAiErr) {
            console.warn("OpenAI Generation Error:", openAiErr.message, "Falling back to Groq...");
            if (groqKey) {
                const groq = new OpenAI({ apiKey: groqKey.trim(), baseURL: "https://api.groq.com/openai/v1" });
                const groqResponse = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                });
                generatedText = groqResponse.choices[0].message.content.trim();
            } else {
                throw openAiErr;
            }
        }
        
        res.json({ success: true, response: generatedText });
    } catch (error) {
        console.error("AI Generation Final Error:", error.message);
        res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
});

export default router;
