type AffirmationTemplate = {
  category: string;
  templates: string[];
  positiveWords: string[];
  transformations: { [key: string]: string };
};

const affirmationTemplates: { [key: string]: AffirmationTemplate } = {
  smoking: {
    category: 'smoking',
    templates: [
      "I choose {{positive}} choices for my health",
      "Every day I become more {{positive}}",
      "I am {{positive}} and {{positive}} every single day",
      "My body thanks me for being {{positive}}",
      "I embrace my {{positive}} lifestyle",
      "I deserve to be {{positive}} and {{positive}}",
      "My determination grows {{positive}} each day",
      "I celebrate my {{positive}} decisions",
      "I am naturally {{positive}} and {{positive}}",
      "My life is increasingly {{positive}}",
      "I radiate {{positive}} energy",
      "I am in control and {{positive}}",
      "Each moment I grow more {{positive}}",
      "My body is becoming more {{positive}}",
      "I choose to be {{positive}} and {{positive}}"
    ],
    positiveWords: [
      "healthy", "strong", "free", "vibrant", "energetic", 
      "confident", "determined", "focused", "mindful", "resilient",
      "empowered", "balanced", "peaceful", "refreshed", "vital"
    ],
    transformations: {
      "kill": "live",
      "die": "thrive",
      "smoke": "breathe",
      "cigarette": "fresh air",
      "need": "choose",
      "want": "deserve",
      "cant": "can",
      "struggle": "grow"
    }
  },
  confidence: {
    category: 'confidence',
    templates: [
      "I am naturally {{positive}} in all situations",
      "I radiate {{positive}} energy to others",
      "My {{positive}} nature draws people to me",
      "I am becoming more {{positive}} each day",
      "People appreciate my {{positive}} presence",
      "I choose to be {{positive}} and {{positive}}",
      "My {{positive}} energy is contagious",
      "I deserve to feel {{positive}} and {{positive}}",
      "Every day I grow more {{positive}}",
      "I embrace my {{positive}} self fully",
      "My confidence grows {{positive}} naturally",
      "I am worthy of being {{positive}}",
      "Others see me as {{positive}} and {{positive}}",
      "I naturally attract {{positive}} experiences",
      "My {{positive}} attitude creates opportunities"
    ],
    positiveWords: [
      "confident", "strong", "charismatic", "magnetic", "engaging",
      "authentic", "inspiring", "remarkable", "exceptional", "valued",
      "appreciated", "respected", "admired", "capable", "brilliant"
    ],
    transformations: {
      "shy": "outgoing",
      "afraid": "brave",
      "nervous": "calm",
      "anxious": "peaceful",
      "weak": "strong",
      "inadequate": "capable",
      "unworthy": "deserving"
    }
  },
  procrastination: {
    category: 'procrastination',
    templates: [
      "I take {{positive}} action immediately",
      "I am becoming more {{positive}} each day",
      "My {{positive}} habits grow stronger",
      "I choose {{positive}} decisions naturally",
      "Taking action makes me feel {{positive}}",
      "I am {{positive}} and {{positive}} with my time",
      "My productivity becomes more {{positive}}",
      "I embrace {{positive}} choices easily",
      "Each task makes me more {{positive}}",
      "I enjoy being {{positive}} and {{positive}}",
      "My focus grows {{positive}} naturally",
      "I am naturally {{positive}} and efficient",
      "Starting tasks makes me feel {{positive}}",
      "I maintain {{positive}} momentum easily",
      "My energy is {{positive}} and abundant"
    ],
    positiveWords: [
      "productive", "focused", "efficient", "motivated", "driven",
      "organized", "decisive", "energetic", "accomplished", "proactive",
      "determined", "successful", "disciplined", "concentrated", "empowered"
    ],
    transformations: {
      "later": "now",
      "wait": "act",
      "delay": "begin",
      "lazy": "energetic",
      "overwhelmed": "capable",
      "stuck": "moving",
      "pressure": "flow"
    }
  },
  fitness: {
    category: 'fitness',
    templates: [
      "I am naturally {{positive}} and {{positive}}",
      "My body grows {{positive}} each day",
      "Exercise makes me feel {{positive}}",
      "I choose {{positive}} activities easily",
      "Being active makes me {{positive}}",
      "My energy becomes more {{positive}}",
      "I enjoy feeling {{positive}} and strong",
      "My body deserves {{positive}} movement",
      "Each workout makes me more {{positive}}",
      "I maintain {{positive}} habits naturally",
      "My health grows {{positive}} daily",
      "I am becoming more {{positive}}",
      "Movement makes me feel {{positive}}",
      "I embrace {{positive}} choices joyfully",
      "My vitality is {{positive}} and natural"
    ],
    positiveWords: [
      "active", "energetic", "strong", "vital", "powerful",
      "healthy", "vibrant", "dynamic", "athletic", "resilient",
      "fit", "agile", "refreshed", "invigorated", "unstoppable"
    ],
    transformations: {
      "tired": "energized",
      "lazy": "active",
      "weak": "strong",
      "heavy": "light",
      "slow": "swift",
      "unfit": "improving",
      "exhausted": "invigorated"
    }
  }
};

function generateAffirmations(category: string, negativeThought: string): string[] {
  const template = affirmationTemplates[category];
  if (!template) {
    throw new Error("Invalid category");
  }

  // Transform negative words to positive ones
  let positiveThought = negativeThought.toLowerCase();
  Object.entries(template.transformations).forEach(([negative, positive]) => {
    positiveThought = positiveThought.replace(new RegExp(negative, 'gi'), positive);
  });

  // Generate affirmations using templates
  const affirmations = template.templates.map(templateStr => {
    let affirmation = templateStr;
    while (affirmation.includes("{{positive}}")) {
      const randomPositive = template.positiveWords[Math.floor(Math.random() * template.positiveWords.length)];
      affirmation = affirmation.replace("{{positive}}", randomPositive);
    }
    return affirmation;
  });

  // Add some specific affirmations based on the transformed positive thought
  const specificAffirmation = `I am ${template.positiveWords[0]} and ${template.positiveWords[1]} as ${positiveThought}`;
  affirmations.push(specificAffirmation);

  // Remove duplicates while maintaining array type
  return Array.from(new Set(affirmations));
}

export { generateAffirmations };
