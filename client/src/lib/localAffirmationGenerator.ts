import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

interface Template {
  prefix: string;
  suffix: string;
  transformations: { [key: string]: string };
}

const templates: { [key: string]: Template[] } = {
  smoking: [
    {
      prefix: "I choose",
      suffix: "for my health and well-being",
      transformations: {
        "smoke": "breathe fresh air",
        "cigarette": "deep breath",
        "nicotine": "natural energy"
      }
    },
    {
      prefix: "Every day I become more",
      suffix: "as I embrace a smoke-free life",
      transformations: {
        "addicted": "liberated",
        "dependent": "independent",
        "craving": "content"
      }
    }
  ],
  confidence: [
    {
      prefix: "I radiate",
      suffix: "in every situation",
      transformations: {
        "shy": "confident",
        "afraid": "courageous",
        "nervous": "composed"
      }
    }
  ],
  // Add more categories as needed
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
    const model = await loadModel();
    const inputEmbedding = await model.embed([input]);
    
    // Generate base affirmations using templates
    const categoryTemplates = templates[category] || templates['confidence'];
    let affirmations: string[] = [];
    
    // Transform negative words to positive ones
    let transformedInput = input.toLowerCase();
    for (const template of categoryTemplates) {
      Object.entries(template.transformations).forEach(([negative, positive]) => {
        transformedInput = transformedInput.replace(new RegExp(negative, 'gi'), positive);
      });
      
      // Generate affirmation using the template
      affirmations.push(`${template.prefix} ${transformedInput} ${template.suffix}`);
    }

    // Encode generated affirmations
    const affirmationEmbeddings = await model.embed(affirmations);
    
    // Calculate similarities and sort by relevance
    const similarities = tf.matMul(affirmationEmbeddings, inputEmbedding, false, true);
    const values = await similarities.data();
    
    // Sort affirmations by similarity scores
    const rankedAffirmations = affirmations
      .map((text, i) => ({ text, score: values[i] }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.text);

    // Clean up tensors
    inputEmbedding.dispose();
    affirmationEmbeddings.dispose();
    similarities.dispose();

    return rankedAffirmations;
  } catch (error) {
    console.error('Error generating affirmations:', error);
    // Fallback to template-based generation if model fails
    return generateFallbackAffirmations(input, category);
  }
}

function generateFallbackAffirmations(input: string, category: string): string[] {
  const categoryTemplates = templates[category] || templates['confidence'];
  const affirmations: string[] = [];
  
  for (const template of categoryTemplates) {
    let transformedInput = input.toLowerCase();
    Object.entries(template.transformations).forEach(([negative, positive]) => {
      transformedInput = transformedInput.replace(new RegExp(negative, 'gi'), positive);
    });
    affirmations.push(`${template.prefix} ${transformedInput} ${template.suffix}`);
  }
  
  return affirmations;
}

export { generateSimilarPhrases, loadModel };
