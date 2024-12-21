import { Router } from 'express';
import { generateAffirmations } from '../utils/affirmationGenerator';

const router = Router();

router.post('/generate-affirmations', async (req, res) => {
  try {
    const { category, negativeThought } = req.body;

    if (!category || !negativeThought) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const affirmations = generateAffirmations(category, negativeThought);
      return res.json({ affirmations });
    } catch (error: any) {
      console.error('Error generating affirmations:', error);
      return res.status(400).json({ 
        error: error.message || 'Failed to generate affirmations' 
      });
    }
  } catch (error) {
    console.error('Request validation error:', error);
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
});

export default router;
