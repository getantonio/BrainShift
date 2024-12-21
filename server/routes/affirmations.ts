import { Router } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

router.post('/generate-affirmations', async (req, res) => {
  try {
    const { category, negativeThought } = req.body;

    if (!category || !negativeThought) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional hypnotherapist and cognitive behavioral expert. Generate affirmations that are positive, personal, and transformative."
          },
          {
            role: "user",
            content: `Generate 10-15 powerful, positive affirmations to help someone overcome this negative thought: "${negativeThought}" related to ${category}.
            The affirmations must:
            1. Be in first person, present tense
            2. Be entirely positive (avoid negative words)
            3. Feel natural and personally meaningful
            4. Address the root cause of the negative thought
            5. Be specific to the behavior change
            
            Format your response as a JSON object with an 'affirmations' array containing the affirmation strings.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return res.json(result);
    } catch (error: any) {
      console.error('Error generating affirmations:', error);
      
      // Check for specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        return res.status(402).json({
          error: 'OpenAI API quota exceeded. Please ensure your API key has available credits.'
        });
      } else if (error.status === 429) {
        return res.status(429).json({
          error: 'Too many requests. Please try again in a few moments.'
        });
      } else if (error.status === 401) {
        return res.status(401).json({
          error: 'Invalid API key. Please check your OpenAI API key configuration.'
        });
      }

      return res.status(500).json({ 
        error: 'Failed to generate affirmations. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Request validation error:', error);
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
});

export default router;
