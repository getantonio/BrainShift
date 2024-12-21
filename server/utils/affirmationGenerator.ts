type AffirmationTemplate = {
  category: string;
  templates: string[];
  positiveWords: string[];
  transformations: { [key: string]: string };
};

const affirmationTemplates: { [key: string]: AffirmationTemplate } = {
  confidence: {
    category: 'confidence',
    templates: [
      "I am naturally {{positive}} in all situations",
      "I radiate {{positive}} energy wherever I go",
      "My {{positive}} presence positively impacts others",
      "I grow more {{positive}} with each passing day",
      "People are drawn to my {{positive}} energy",
      "I embody {{positive}} and {{positive}} qualities effortlessly",
      "My {{positive}} spirit uplifts those around me",
      "I deserve and embrace being {{positive}} and {{positive}}",
      "My confidence strengthens as I become more {{positive}}",
      "I fully accept and love my {{positive}} self",
      "My inner {{positive}} light shines brightly",
      "I attract {{positive}} opportunities naturally",
      "Success flows to me as I remain {{positive}}",
      "I trust my {{positive}} instincts completely",
      "Every challenge makes me more {{positive}}"
    ],
    positiveWords: [
      "confident", "charismatic", "magnetic", "engaging", "authentic",
      "inspiring", "remarkable", "exceptional", "valued", "appreciated",
      "respected", "admired", "capable", "brilliant", "powerful"
    ],
    transformations: {
      "shy": "outgoing",
      "afraid": "courageous",
      "nervous": "composed",
      "anxious": "peaceful",
      "weak": "strong",
      "inadequate": "capable",
      "unworthy": "deserving"
    }
  },
  productivity: {
    category: 'productivity',
    templates: [
      "I take {{positive}} action without hesitation",
      "My focus grows increasingly {{positive}}",
      "I maintain {{positive}} momentum throughout my day",
      "My energy flows {{positive}} and abundantly",
      "Each task I complete makes me more {{positive}}",
      "I am naturally {{positive}} in managing my time",
      "My productivity rises to {{positive}} levels",
      "I make {{positive}} choices effortlessly",
      "My work ethic becomes more {{positive}} daily",
      "I embrace {{positive}} habits with ease",
      "My efficiency grows more {{positive}} each day",
      "I attract {{positive}} opportunities through my actions",
      "My mind stays clear and {{positive}}",
      "I accomplish tasks with {{positive}} energy",
      "Success follows my {{positive}} approach"
    ],
    positiveWords: [
      "productive", "focused", "efficient", "motivated", "driven",
      "organized", "decisive", "energetic", "accomplished", "proactive",
      "determined", "successful", "disciplined", "diligent", "empowered"
    ],
    transformations: {
      "later": "now",
      "procrastinate": "act",
      "delay": "begin",
      "lazy": "energetic",
      "overwhelmed": "capable",
      "stuck": "progressing",
      "pressure": "flow"
    }
  },
  health: {
    category: 'health',
    templates: [
      "My body grows stronger and more {{positive}} each day",
      "I choose {{positive}} options that nourish my body",
      "My health improves with each {{positive}} choice",
      "I deserve to feel {{positive}} and vibrant",
      "My energy becomes more {{positive}} naturally",
      "I embrace {{positive}} lifestyle choices",
      "My vitality increases as I make {{positive}} decisions",
      "I maintain {{positive}} habits effortlessly",
      "Every day I become more {{positive}} and healthy",
      "My body thanks me for being {{positive}}",
      "I radiate {{positive}} wellness from within",
      "My immune system grows {{positive}} each day",
      "I attract {{positive}} health outcomes",
      "My body responds {{positive}} to healthy choices",
      "I embody {{positive}} well-being completely"
    ],
    positiveWords: [
      "healthy", "vibrant", "energetic", "strong", "resilient",
      "balanced", "vital", "refreshed", "nourished", "thriving",
      "active", "radiant", "renewed", "invigorated", "harmonious"
    ],
    transformations: {
      "sick": "healing",
      "tired": "energized",
      "weak": "strong",
      "unhealthy": "wholesome",
      "stressed": "peaceful",
      "drained": "revitalized",
      "exhausted": "refreshed"
    }
  },
  relationships: {
    category: 'relationships',
    templates: [
      "I attract {{positive}} and genuine connections",
      "My relationships grow more {{positive}} each day",
      "I am worthy of {{positive}} and loving relationships",
      "I communicate with {{positive}} clarity and empathy",
      "My heart opens to {{positive}} connections",
      "I create {{positive}} and meaningful bonds",
      "My relationships become more {{positive}} naturally",
      "I attract {{positive}} people into my life",
      "I deserve {{positive}} and respectful relationships",
      "My presence brings {{positive}} energy to others",
      "I maintain {{positive}} boundaries effortlessly",
      "Love flows {{positive}} in my relationships",
      "I choose {{positive}} and uplifting connections",
      "My relationships reflect my {{positive}} nature",
      "I inspire {{positive}} growth in others"
    ],
    positiveWords: [
      "loving", "supportive", "harmonious", "understanding", "compassionate",
      "genuine", "authentic", "respectful", "nurturing", "empathetic",
      "caring", "trustworthy", "loyal", "sincere", "accepting"
    ],
    transformations: {
      "lonely": "connected",
      "isolated": "involved",
      "rejected": "accepted",
      "misunderstood": "understood",
      "distant": "close",
      "disconnected": "united",
      "afraid": "trusting"
    }
  },
  mindfulness: {
    category: 'mindfulness',
    templates: [
      "I remain {{positive}} in the present moment",
      "My awareness grows more {{positive}} each day",
      "I observe my thoughts with {{positive}} clarity",
      "My mind maintains {{positive}} peace naturally",
      "I embrace each moment with {{positive}} attention",
      "My consciousness expands {{positive}} daily",
      "I experience {{positive}} mindful moments easily",
      "My presence becomes more {{positive}} naturally",
      "I cultivate {{positive}} inner peace effortlessly",
      "Each breath brings {{positive}} awareness",
      "I maintain {{positive}} mental clarity",
      "My mind stays {{positive}} and centered",
      "I choose {{positive}} conscious living",
      "My thoughts flow in a {{positive}} direction",
      "I embody {{positive}} present-moment awareness"
    ],
    positiveWords: [
      "mindful", "aware", "present", "centered", "peaceful",
      "conscious", "focused", "attentive", "grounded", "balanced",
      "serene", "calm", "clear", "receptive", "harmonious"
    ],
    transformations: {
      "distracted": "focused",
      "scattered": "centered",
      "anxious": "peaceful",
      "overwhelmed": "balanced",
      "restless": "calm",
      "stressed": "relaxed",
      "worried": "present"
    }
  },
  success: {
    category: 'success',
    templates: [
      "I attract {{positive}} opportunities effortlessly",
      "My success grows more {{positive}} each day",
      "I embrace {{positive}} achievements naturally",
      "My potential expands {{positive}} continuously",
      "I create {{positive}} results consistently",
      "My goals manifest in {{positive}} ways",
      "I deserve {{positive}} abundance and success",
      "My path leads to {{positive}} outcomes",
      "I am naturally {{positive}} and successful",
      "My actions produce {{positive}} results",
      "I maintain {{positive}} momentum easily",
      "Success flows to me {{positive}} and naturally",
      "I attract {{positive}} opportunities daily",
      "My success inspires {{positive}} growth in others",
      "I embody {{positive}} achievement effortlessly"
    ],
    positiveWords: [
      "successful", "accomplished", "prosperous", "achieving", "triumphant",
      "victorious", "thriving", "abundant", "excellent", "outstanding",
      "remarkable", "exceptional", "brilliant", "masterful", "distinguished"
    ],
    transformations: {
      "failing": "succeeding",
      "struggling": "progressing",
      "stuck": "advancing",
      "limited": "unlimited",
      "blocked": "flowing",
      "defeated": "victorious",
      "uncertain": "confident"
    }
  },
  creativity: {
    category: 'creativity',
    templates: [
      "My creativity flows {{positive}} and freely",
      "I express myself in {{positive}} ways",
      "My imagination grows more {{positive}} daily",
      "I embrace {{positive}} creative inspiration",
      "My ideas become more {{positive}} naturally",
      "I access {{positive}} creative energy easily",
      "My artistic expression is {{positive}} and unique",
      "I trust my {{positive}} creative instincts",
      "Innovation flows {{positive}} through me",
      "I attract {{positive}} creative opportunities",
      "My creativity expands in {{positive}} ways",
      "I manifest {{positive}} artistic visions",
      "My creative spirit grows {{positive}} daily",
      "I embody {{positive}} creative energy",
      "My creativity inspires {{positive}} outcomes"
    ],
    positiveWords: [
      "creative", "innovative", "imaginative", "inspired", "artistic",
      "expressive", "original", "inventive", "visionary", "resourceful",
      "ingenious", "brilliant", "unique", "dynamic", "intuitive"
    ],
    transformations: {
      "blocked": "flowing",
      "stuck": "inspired",
      "uninspired": "creative",
      "limited": "boundless",
      "restricted": "free",
      "conventional": "innovative",
      "ordinary": "extraordinary"
    }
  },
  growth: {
    category: 'growth',
    templates: [
      "I embrace {{positive}} personal growth daily",
      "My development becomes more {{positive}} naturally",
      "I welcome {{positive}} transformative experiences",
      "My potential expands {{positive}} continuously",
      "I attract {{positive}} growth opportunities",
      "My journey leads to {{positive}} evolution",
      "I embrace {{positive}} changes easily",
      "My growth accelerates {{positive}} naturally",
      "I choose {{positive}} self-improvement daily",
      "My progress becomes more {{positive}} each day",
      "I maintain {{positive}} forward momentum",
      "My evolution unfolds {{positive}} and naturally",
      "I create {{positive}} personal breakthroughs",
      "My growth inspires {{positive}} change in others",
      "I embody {{positive}} continuous improvement"
    ],
    positiveWords: [
      "evolving", "growing", "developing", "advancing", "progressing",
      "improving", "transforming", "expanding", "flourishing", "rising",
      "ascending", "elevating", "actualizing", "becoming", "transcending"
    ],
    transformations: {
      "stagnant": "growing",
      "stuck": "progressing",
      "resistant": "accepting",
      "fearful": "courageous",
      "limited": "unlimited",
      "comfortable": "challenging",
      "fixed": "flexible"
    }
  },
  resilience: {
    category: 'resilience',
    templates: [
      "I remain {{positive}} through all challenges",
      "My strength grows more {{positive}} each day",
      "I handle difficulties with {{positive}} grace",
      "My resilience becomes more {{positive}} naturally",
      "I maintain {{positive}} determination easily",
      "Challenges make me more {{positive}}",
      "I embrace {{positive}} adaptability",
      "My inner strength grows {{positive}} daily",
      "I face obstacles with {{positive}} courage",
      "My spirit stays {{positive}} and unbreakable",
      "I demonstrate {{positive}} perseverance",
      "Adversity makes me more {{positive}}",
      "I choose {{positive}} responses to challenges",
      "My resilience inspires {{positive}} strength in others",
      "I embody {{positive}} unwavering determination"
    ],
    positiveWords: [
      "resilient", "strong", "adaptable", "determined", "persistent",
      "unshakeable", "tenacious", "enduring", "resolute", "steadfast",
      "courageous", "indomitable", "unstoppable", "powerful", "unwavering"
    ],
    transformations: {
      "weak": "strong",
      "fragile": "resilient",
      "vulnerable": "protected",
      "defeated": "determined",
      "discouraged": "motivated",
      "overwhelmed": "capable",
      "broken": "healing"
    }
  },
  abundance: {
    category: 'abundance',
    templates: [
      "I attract {{positive}} abundance effortlessly",
      "My prosperity grows more {{positive}} each day",
      "I deserve {{positive}} abundance in all forms",
      "Wealth flows to me {{positive}} and naturally",
      "I maintain {{positive}} abundant thinking",
      "My life fills with {{positive}} prosperity",
      "I create {{positive}} abundant outcomes",
      "My abundance grows {{positive}} continuously",
      "I attract {{positive}} opportunities easily",
      "My prosperity expands {{positive}} naturally",
      "I embody {{positive}} abundant energy",
      "Success flows {{positive}} in my direction",
      "I generate {{positive}} abundant results",
      "My abundance inspires {{positive}} growth in others",
      "I choose {{positive}} prosperous thoughts"
    ],
    positiveWords: [
      "abundant", "prosperous", "wealthy", "flourishing", "thriving",
      "plentiful", "bountiful", "affluent", "rich", "successful",
      "fortunate", "blessed", "prospering", "abundant", "manifesting"
    ],
    transformations: {
      "lack": "abundance",
      "scarcity": "plenty",
      "poor": "wealthy",
      "limited": "unlimited",
      "wanting": "having",
      "needy": "abundant",
      "restricted": "free"
    }
  },
  career: {
    category: 'career',
    templates: [
      "I attract {{positive}} career opportunities",
      "My professional growth becomes more {{positive}}",
      "I create {{positive}} work outcomes easily",
      "My career path leads to {{positive}} success",
      "I maintain {{positive}} work relationships",
      "My skills grow more {{positive}} each day",
      "I demonstrate {{positive}} leadership naturally",
      "My work brings {{positive}} satisfaction",
      "I achieve {{positive}} professional goals",
      "My career advances in {{positive}} ways",
      "I contribute {{positive}} value at work",
      "My expertise grows {{positive}} continuously",
      "I attract {{positive}} recognition naturally",
      "My work inspires {{positive}} results",
      "I embody {{positive}} professional excellence"
    ],
    positiveWords: [
      "successful", "professional", "accomplished", "skilled", "capable",
      "talented", "effective", "productive", "influential", "respected",
      "valued", "expert", "proficient", "masterful", "outstanding"
    ],
    transformations: {
      "stuck": "advancing",
      "undervalued": "appreciated",
      "stagnant": "growing",
      "unfulfilled": "satisfied",
      "stressed": "balanced",
      "overwhelmed": "capable",
      "uncertain": "confident"
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
