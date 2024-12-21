import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

interface Template {
  prefix: string;
  suffix: string;
  transformations: { [key: string]: string };
}

// Import server-side affirmation templates
import { generateAffirmations } from "../../../server/utils/affirmationGenerator";

const defaultTemplates = {
  confidence: [
    "I believe in myself and my abilities",
    "I deserve success and happiness",
    "I radiate confidence in all that I do",
    "I trust myself to handle any situation with grace",
    "I am proud of who I am becoming",
    "My self-confidence grows with every small success",
    "I embrace my uniqueness and celebrate my strengths",
    "I am worthy of respect and admiration",
    "Challenges are opportunities for me to shine",
    "I walk through life with courage and self-assurance"
  ],
  addiction: [
    "I am stronger than my cravings and choose a healthier path",
    "I release the hold addiction has over me",
    "Every step I take brings me closer to freedom and wellness",
    "I trust my inner strength to guide me toward recovery",
    "I deserve a life of clarity, joy, and health",
    "I forgive myself for past mistakes and focus on my growth",
    "I choose progress over perfection every day",
    "I am worthy of a life free from addiction",
    "I take pride in every small victory on my journey",
    "My commitment to healing inspires me daily"
  ],
  sleep: [
    "I release the stress of the day and welcome restful sleep",
    "My mind and body relax completely as I prepare for sleep",
    "I deserve deep, restorative sleep every night",
    "I let go of all worries and surrender to peaceful dreams",
    "Each night, my sleep renews and energizes me",
    "I create a calm, comfortable space for sleep",
    "I fall asleep easily and wake up refreshed",
    "My body knows how to rest and heal as I sleep",
    "I trust the process of relaxation to bring me peace",
    "Sleep is my sanctuary, and I honor it fully"
  ],
  emotional: [
    "I am the master of my emotions and respond with calmness",
    "I allow myself to feel without being overwhelmed",
    "Every emotion I experience teaches me something valuable",
    "I release what no longer serves me emotionally",
    "I choose peace over chaos in all situations",
    "My emotional resilience grows stronger every day",
    "I am in charge of how I react to life's challenges",
    "I honor my emotions but do not let them define me",
    "I attract peace and positivity into my life",
    "I forgive myself and others, creating emotional freedom"
  ]
};

let model: use.UniversalSentenceEncoder | null = null;

async function loadModel() {
  if (!model) {
    try {
      model = await use.load();
      console.log('Universal Sentence Encoder model loaded successfully');
    } catch (error) {
      console.error('Error loading Universal Sentence Encoder model:', error);
      throw new Error('Failed to load the language model');
    }
  }
  return model;
}

async function generateSimilarPhrases(input: string, category: string): Promise<string[]> {
  try {
    // First try to generate affirmations using the server-side templates
    const serverAffirmations = generateAffirmations(category, input);
    
    // For custom category or if server affirmations are sufficient
    if ((category !== 'custom' && serverAffirmations && serverAffirmations.length >= 10) || 
        (category === 'custom' && serverAffirmations && serverAffirmations.length > 0)) {
      return serverAffirmations;
    }

    // If server generation fails or returns too few results, use local generation
    const model = await loadModel();
    const inputEmbedding = await model.embed([input]);
    
    // Get base affirmations for the category or use default confidence templates
    let baseAffirmations = defaultTemplates[category as keyof typeof defaultTemplates] || defaultTemplates.confidence;
    
    // Generate more variations using the embeddings
    const affirmationEmbeddings = await model.embed(baseAffirmations);
    
    // Calculate semantic similarities
    const similarities = tf.tidy(() => {
      // Ensure proper tensor ranks and shapes
      const reshapedInput = inputEmbedding.reshape([1, -1]);
      return tf.matMul(affirmationEmbeddings, reshapedInput, false, true);
    });
    const values = await similarities.data();
    
    // Sort and get the most relevant affirmations
    const rankedAffirmations = baseAffirmations
      .map((text, i) => ({ text, score: values[i] }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.text);

    // Clean up tensors
    inputEmbedding.dispose();
    affirmationEmbeddings.dispose();
    similarities.dispose();

    // Combine server and local affirmations, removing duplicates
    const combinedAffirmations = Array.from(new Set([...serverAffirmations || [], ...rankedAffirmations]));
    
    // Ensure we return at least 10 affirmations
    while (combinedAffirmations.length < 10) {
      const randomBase = baseAffirmations[Math.floor(Math.random() * baseAffirmations.length)];
      if (!combinedAffirmations.includes(randomBase)) {
        combinedAffirmations.push(randomBase);
      }
    }

    return combinedAffirmations;
  } catch (error) {
    console.error('Error generating affirmations:', error);
    // Return default templates if both server and model generation fail
    return defaultTemplates[category as keyof typeof defaultTemplates] || defaultTemplates.confidence;
  }
}

function generateFallbackAffirmations(input: string, category: string): string[] {
    const categoryTemplates = defaultTemplates[category] || defaultTemplates['confidence'];
    return categoryTemplates;
}

export { generateSimilarPhrases, loadModel };