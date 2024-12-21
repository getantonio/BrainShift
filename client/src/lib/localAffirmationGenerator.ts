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
    "I am naturally confident in all situations",
    "I radiate positive energy wherever I go",
    "My authentic presence positively impacts others",
    "I grow more confident with each passing day",
    "People are drawn to my positive energy",
    "I embody strength and wisdom effortlessly",
    "My confident spirit uplifts those around me",
    "I deserve and embrace being powerful and authentic",
    "My confidence strengthens as I become more resilient",
    "I fully accept and love my authentic self"
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
    
    if (serverAffirmations && serverAffirmations.length >= 10) {
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
    const similarities = tf.matMul(affirmationEmbeddings, inputEmbedding, false, true);
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