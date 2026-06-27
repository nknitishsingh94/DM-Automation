import OpenAI from 'openai';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.");
  }
  return new OpenAI({ apiKey });
};

/**
 * Rewrites scraped LinkedIn post content according to strict brand constraints.
 * 
 * @param {string} originalText - The scraped text from LinkedIn
 * @param {string} defaultHeader - Text to prepend
 * @param {string} defaultFooter - Text to append
 * @returns {Promise<string>} - The rewritten text
 */
export async function rewriteLinkedInPost(originalText, defaultHeader = '', defaultFooter = '') {
  try {
    const openai = getOpenAIClient();

    const systemPrompt = `You are a professional social media copywriter.
Your task is to rewrite a LinkedIn post while strictly adhering to the following rules:
1. Do NOT change, rewrite, or alter the brand name.
2. Keep all mentions, hashtags, and company page links EXACTLY as they are.
3. Rephrase the core message to be engaging, professional, and slightly distinct from the original.
4. Keep the tone professional and industry-appropriate.

Do not include the header or footer in your response; just provide the rewritten body text.`;

    const userPrompt = `Here is the original post text to rewrite:\n\n${originalText}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fallback to mini for speed/cost, adjust if needed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    let rewrittenBody = response.choices[0].message.content.trim();

    // Assemble final text
    const parts = [];
    if (defaultHeader) parts.push(defaultHeader);
    parts.push(rewrittenBody);
    if (defaultFooter) parts.push(defaultFooter);

    return parts.join('\n\n');
  } catch (error) {
    console.error('❌ [AI Rewriter] Error rewriting text:', error.message);
    // If AI fails, fallback to original text with header/footer
    const parts = [];
    if (defaultHeader) parts.push(defaultHeader);
    parts.push(originalText);
    if (defaultFooter) parts.push(defaultFooter);
    return parts.join('\n\n');
  }
}
