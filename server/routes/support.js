import express from 'express';
import OpenAI from 'openai';
import FormSubmission from '../models/FormSubmission.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const dotenvModule = await import('dotenv');
        dotenvModule.default.config();

        const geminiKey = process.env.GEMINI_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;

        const systemPrompt = `You are the smart100X AI Support Assistant. You help users with questions about smart100X — a social media automation platform for Instagram and Facebook.

Key features of smart100X:
- Comment-to-DM automation
- DM automation with keyword triggers
- AI-powered auto-replies
- Post scheduling
- Visual Flow Builder
- Universal Triggers
- Audience/Contact management
- AI Studio for customizing AI agent

Common setup steps:
1. Sign up and create a workspace
2. Go to Settings > Connect Instagram/Facebook via Meta OAuth
3. Create automations in Platform Automation or Universal Triggers
4. Set trigger keywords and response messages
5. Enable AI replies in AI Studio

If you don't know the answer, suggest emailing smart100x.support@gmail.com or visiting the Help Center.
Keep replies short, friendly, and helpful. Use emojis occasionally. Reply in the same language the user writes in.`;

        let reply = null;

        if (geminiKey) {
            try {
                const axiosModule = await import('axios');
                const axiosClient = axiosModule.default;
                const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
                
                for (const model of models) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                        const chatHistory = (history || []).map(m => ({
                            parts: [{ text: m.content }],
                            role: m.role === 'assistant' ? 'model' : 'user'
                        }));
                        
                        const response = await axiosClient.post(url, {
                            contents: [
                                ...chatHistory,
                                { parts: [{ text: message }], role: 'user' }
                            ],
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                        }, { timeout: 10000 });
                        
                        reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (reply) break;
                    } catch (e) {
                        console.warn(`Support chat Gemini ${model} failed:`, e.response?.data?.error?.message || e.message);
                    }
                }
            } catch (e) {
                console.warn('Support chat Gemini failed:', e.message);
            }
        }

        if (!reply && groqKey) {
            try {
                const groq = new OpenAI({ apiKey: groqKey.trim(), baseURL: "https://api.groq.com/openai/v1" });
                const chatMessages = [
                    { role: 'system', content: systemPrompt },
                    ...(history || []).map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: message }
                ];
                const response = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: chatMessages,
                    temperature: 0.7,
                    max_tokens: 500,
                });
                reply = response.choices[0]?.message?.content;
            } catch (e) {
                console.warn('Support chat Groq failed:', e.message);
            }
        }

        if (!reply) {
            reply = "I'm having a bit of trouble right now! 😅 Please email us at smart100x.support@gmail.com and we'll get back to you quickly!";
        }

        res.json({ response: reply });
    } catch (error) {
        console.error('Support AI Error:', error.message);
        res.json({ response: "Sorry, I'm experiencing technical difficulties. Please email smart100x.support@gmail.com for help! 🙏" });
    }
});

router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email and message are required.' });
        }

        const submission = new FormSubmission({
            formId: 'system_support_form',
            data: { name, email, subject, message },
            submittedAt: new Date()
        });

        await submission.save();

        console.log(`✉️ New Support Inquiry from ${email}: ${subject}`);
        
        res.status(200).json({ message: 'Support request received.' });
    } catch (err) {
        console.error("Support Contact Error:", err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
