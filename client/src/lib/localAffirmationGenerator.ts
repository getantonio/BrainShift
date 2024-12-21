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
  "quit_smoking_addictions": [
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
  "better_sleep": [
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
  "emotional_mastery": [
    "I am the master of my emotions and navigate them with wisdom",
    "I embrace all emotions while maintaining inner balance",
    "My emotional intelligence grows stronger each day",
    "I respond to life's challenges with grace and understanding",
    "I transform emotional energy into personal power",
    "My heart and mind work in perfect harmony",
    "I choose my emotional state with conscious awareness",
    "I am grounded and centered in all situations",
    "My emotional wisdom guides me to make empowering choices",
    "I cultivate inner peace regardless of external circumstances"
  ],
  "confidence": [
    "I radiate confidence and embrace my authentic power",
    "I trust my abilities and know my worth completely",
    "My self-assurance grows stronger with each experience",
    "I am worthy of respect, love, and admiration",
    "I embody confidence in everything I do",
    "My presence is powerful and my spirit is unshakeable",
    "I believe in myself unconditionally",
    "Success flows to me naturally as I embrace my potential",
    "I am unstoppable in pursuing my dreams",
    "My confidence inspires others to believe in themselves"
  ],
  "happiness": [
    "Joy flows through me naturally and abundantly",
    "I choose happiness in every moment of every day",
    "My heart is filled with gratitude and contentment",
    "I attract positive experiences and joyful moments",
    "My happiness radiates from within and touches others",
    "I deserve and welcome unlimited happiness",
    "Every day brings new reasons to smile and celebrate",
    "I am a magnet for joy, laughter, and wonderful experiences",
    "My life is filled with beauty and endless possibilities",
    "I create my own happiness and share it generously"
  ],
  "focus": [
    "My mind is sharp, clear, and powerfully focused",
    "I concentrate effortlessly on what matters most",
    "My attention is laser-sharp and precisely directed",
    "I accomplish tasks with perfect concentration",
    "I maintain unwavering focus on my goals",
    "My mind is free from distractions and perfectly centered",
    "I channel my energy into productive focus",
    "My concentration grows stronger each day",
    "I easily maintain deep, sustained focus",
    "I am fully present and engaged in everything I do"
  ],
  "habits_discipline": [
    "I am master of my habits and architect of my destiny",
    "My discipline grows stronger with each conscious choice",
    "I consistently take actions that serve my highest good",
    "My healthy habits create extraordinary results",
    "I embrace discipline as a path to freedom",
    "Each day I build habits that transform my life",
    "I am committed to continuous self-improvement",
    "My willpower is unshakeable and grows stronger daily",
    "I choose habits that empower and elevate me",
    "My disciplined actions create my desired reality"
  ],
  "money_finance": [
    "I attract abundance and prosperity effortlessly",
    "Money flows to me freely and abundantly",
    "I am worthy of financial success and security",
    "My relationship with money is healthy and prosperous",
    "I make wise financial decisions with confidence",
    "Wealth and abundance are my natural state",
    "I deserve and welcome unlimited financial success",
    "My income increases steadily and consistently",
    "I am a magnet for financial opportunities",
    "My financial future is bright and secure"
  ],
  "healing_recovery": [
    "My body has infinite healing wisdom and power",
    "I welcome perfect health and complete recovery",
    "Every cell in my body radiates with healing energy",
    "I trust my body's natural healing abilities",
    "Each day I grow stronger and healthier",
    "My healing journey is guided by divine wisdom",
    "I embrace the process of healing and renewal",
    "My recovery is swift, complete, and miraculous",
    "I deserve perfect health and I claim it now",
    "My body and mind are in perfect healing harmony"
  ],
  "fitness": [
    "My body is strong, healthy, and full of energy",
    "I am committed to my physical well-being",
    "Exercise energizes and strengthens my entire being",
    "I love taking care of my body and staying active",
    "My fitness goals are achievable and exciting",
    "I am becoming stronger and fitter each day",
    "My body is capable of amazing transformations",
    "I enjoy pushing my physical limits and growing stronger",
    "Exercise is a gift I give myself daily",
    "My dedication to fitness creates incredible results"
  ],
  "self_love": [
    "I love and accept myself completely as I am",
    "I am worthy of infinite love and respect",
    "My self-love grows deeper and stronger each day",
    "I honor and cherish my unique qualities",
    "I treat myself with kindness and compassion",
    "I am my own best friend and strongest supporter",
    "I appreciate all aspects of myself",
    "My self-love radiates and attracts more love",
    "I deserve all the love and joy life offers",
    "I am perfectly imperfect and completely lovable"
  ],
  "strengthening_relationships": [
    "My relationships are deep, meaningful, and fulfilling",
    "I attract and nurture healthy connections",
    "I communicate with love, clarity, and authenticity",
    "My relationships grow stronger through understanding",
    "I give and receive love freely and joyfully",
    "I create harmonious and supportive relationships",
    "My connections with others are based on mutual respect",
    "I attract people who recognize and appreciate my worth",
    "My relationships bring out the best in me and others",
    "Love and understanding flow naturally in my relationships"
  ],
  "resilience": [
    "I am stronger than any challenge that comes my way",
    "Adversity makes me more powerful and resilient",
    "I bounce back stronger from every setback",
    "My inner strength is limitless and unshakeable",
    "I transform challenges into opportunities",
    "My resilience grows stronger with each experience",
    "I face all obstacles with courage and determination",
    "I am unstoppable in pursuing my goals",
    "Every challenge reveals my inner strength",
    "I emerge stronger from every difficult situation"
  ],
  "quality_of_life": [
    "Every day my life becomes richer and more fulfilling",
    "I create a life of joy, purpose, and abundance",
    "I deserve and welcome an extraordinary life",
    "My life is filled with wonderful experiences",
    "I actively create the quality of life I desire",
    "Each day brings new opportunities for growth and joy",
    "I am creating my best life with every choice",
    "My life is a beautiful adventure of endless possibilities",
    "I attract experiences that enhance my life",
    "I live each moment with gratitude and purpose"
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