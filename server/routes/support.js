const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// System Prompt: AI ko batana ki woh smart10X ka support agent hai
const SYSTEM_PROMPT = `You are the smart10X AI Support Assistant. 
Your goal is to help users with their Instagram DM automation, AI Studio, and Flow Builder questions.
Be professional, friendly, and helpful. 

Key info about smart10X:
- It's an Instagram automation platform.
- Features: DM Automation, AI Studio (AI replies), Flow Builder (visual editor), Broadcasts, and Audiences.
- Support Email: smart10x.support@gmail.com
- Pricing tiers: Free, Pro, and Business.

If you don't know the answer, ask them to email support. Keep responses concise.`;

router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 500
        });

        const aiResponse = completion.choices[0].message.content;
        res.json({ response: aiResponse });

    } catch (error) {
        console.error('Support AI Error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

module.exports = router;
