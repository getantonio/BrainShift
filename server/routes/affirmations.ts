import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const router = Router();

router.post('/generate-affirmations', async (req, res) => {
  try {
    const { category, negativeThought } = req.body;

    if (!category || !negativeThought) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `As a professional hypnotherapist and cognitive behavioral expert, generate 10-15 powerful, positive affirmations to help someone overcome this negative thought: "${negativeThought}" related to ${category}.

The affirmations should:
1. Be in first person, present tense
2. Be entirely positive (avoid negative words)
3. Feel natural and personally meaningful
4. Address the root cause of the negative thought
5. Be specific to the behavior change

Format the response as a JSON array of strings containing only the affirmations.`;

    const message = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-5-sonnet-20241022',
    });

    // Parse the response from the content array
    const responseText = message.content[0].text || message.content[0].value;
    const affirmations = JSON.parse(responseText);
    
    return res.json({ affirmations });
  } catch (error) {
    console.error('Error generating affirmations:', error);
    return res.status(500).json({ error: 'Failed to generate affirmations' });
  }
});

export default router;
