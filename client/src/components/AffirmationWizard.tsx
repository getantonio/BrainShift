import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RotateCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Predefined behavior categories
const BEHAVIOR_CATEGORIES = [
  {
    id: "custom",
    label: "Custom Affirmations",
    examples: [
      "I'll never be successful in life",
      "Nobody understands or supports me",
      "I'm too broken to be fixed",
      "Everything I try ends in failure"
    ],
  },
  {
    id: "addiction",
    label: "💖 Quit Smoking and Addictions",
    examples: ["I can't quit my bad habits", "I'm powerless over my addiction", "I'll never be free"],
  },
  {
    id: "aging",
    label: "💪 Aging Better",
    examples: ["I'm getting too old", "My best years are behind me", "I can't keep up anymore"],
  },
  {
    id: "consciousness",
    label: "🪷 Altered States of Consciousness",
    examples: ["I can't reach deeper states", "My mind is too chaotic", "I lack spiritual connection"],
  },
  {
    id: "intimacy",
    label: "💋 Better Sex",
    examples: ["I'm not attractive enough", "I lack confidence in intimacy", "I fear rejection"],
  },
  {
    id: "sleep",
    label: "😴 Better Sleep",
    examples: ["I can't fall asleep", "My mind races at night", "I always wake up tired"],
  },
  {
    id: "creativity",
    label: "🎨 Boost Creativity",
    examples: ["I'm not creative enough", "I feel blocked", "My ideas are boring"],
  },
  {
    id: "career",
    label: "📈 Career Growth",
    examples: ["I'm stuck in my career", "I'm undervalued", "I lack direction"],
  },
  {
    id: "coaching",
    label: "🏆 Coaching",
    examples: ["I can't help others", "I'm not qualified enough", "Nobody will listen to me"],
  },
  {
    id: "cognition",
    label: "🧠 Cognition",
    examples: ["My memory is poor", "I can't think clearly", "I'm not smart enough"],
  },
  {
    id: "communication",
    label: "🎤 Communication",
    examples: ["I struggle to express myself", "People misunderstand me", "I fear public speaking"],
  },
  {
    id: "confidence",
    label: "😎 Confidence",
    examples: ["I'm not good enough", "I feel insecure", "People won't like me"],
  },
  {
    id: "community",
    label: "👫 Creating Community",
    examples: ["I'm always alone", "I can't connect with others", "Nobody shares my interests"],
  },
  {
    id: "eating",
    label: "🥄 Eating Well",
    examples: ["I can't stick to healthy eating", "I have no self-control", "I'll always struggle with food"],
  },
  {
    id: "emotional",
    label: "😇 Emotional Mastery",
    examples: ["I can't control my emotions", "I'm too sensitive", "My feelings overwhelm me"],
  },
  {
    id: "entrepreneur",
    label: "😎 Entrepreneurial Mindset",
    examples: ["I'm not cut out for business", "I'll never succeed", "I lack business skills"],
  },
  {
    id: "relationships",
    label: "❤️ Finding Relationships",
    examples: ["I'll always be alone", "Nobody will love me", "I'm not worthy of love"],
  },
  {
    id: "fitness",
    label: "🏃‍♀️ Fitness",
    examples: ["I'm too out of shape", "I'll never be fit", "Exercise is too hard"],
  },
  {
    id: "flow",
    label: "🏄 Flow",
    examples: ["I can't focus", "I'm always distracted", "I can't get in the zone"],
  },
  {
    id: "focus",
    label: "👨‍💻 Focus",
    examples: ["I can't concentrate", "My mind wanders", "I'm easily distracted"],
  },
  {
    id: "habits",
    label: "🥋 Habits & Discipline",
    examples: ["I lack discipline", "I can't stick to habits", "I always give up"],
  },
  {
    id: "happiness",
    label: "😀 Happiness",
    examples: ["I'll never be truly happy", "Life is always hard", "I don't deserve joy"],
  },
  {
    id: "healing",
    label: "🩹 Healing and Recovery",
    examples: ["I'll never heal", "I'm broken", "The pain will never end"],
  },
  {
    id: "heartbreak",
    label: "❤️‍🩹 Healing Heartbreak",
    examples: ["I'll never love again", "The pain is too much", "I can't move on"],
  },
  {
    id: "impact",
    label: "⚡ Impact",
    examples: ["I don't make a difference", "My work doesn't matter", "I can't change anything"],
  },
  {
    id: "influence",
    label: "🌞 Influence",
    examples: ["Nobody listens to me", "I lack charisma", "I can't inspire others"],
  },
  {
    id: "leadership",
    label: "🧗 Leadership",
    examples: ["I'm not a natural leader", "Nobody follows my lead", "I can't handle responsibility"],
  },
  {
    id: "looks",
    label: "😍 Look Good",
    examples: ["I'm not attractive enough", "I'll never look good", "I hate my appearance"],
  },
  {
    id: "meditation",
    label: "🧘 Meditation",
    examples: ["I can't quiet my mind", "Meditation is too hard", "I'm doing it wrong"],
  },
  {
    id: "mindManagement",
    label: "🧠 Mind Management",
    examples: ["My thoughts control me", "I can't manage my mind", "I'm overwhelmed"],
  },
  {
    id: "mindPower",
    label: "✨ Mind Power",
    examples: ["My mind is weak", "I can't control my thoughts", "I lack mental strength"],
  },
  {
    id: "mindset",
    label: "🧠 Mindset",
    examples: ["I'm stuck in negative thinking", "I can't change my mindset", "I always expect the worst"],
  },
  {
    id: "money",
    label: "💰 Money & Finance",
    examples: ["I'll never be wealthy", "Money is scarce", "I'm bad with finances"],
  },
  {
    id: "oneness",
    label: "🌎 Oneness",
    examples: ["I feel disconnected", "I'm all alone", "I don't belong"],
  },
  {
    id: "parenting",
    label: "👩‍👦‍👦 Parenting",
    examples: ["I'm a bad parent", "I'm failing my children", "I can't handle parenting"],
  },
  {
    id: "passion",
    label: "🌈 Passion",
    examples: ["I have no passion", "Life is meaningless", "I can't find my purpose"],
  },
  {
    id: "perception",
    label: "😌 Perceptual Diversity",
    examples: ["I'm too rigid", "I can't see other perspectives", "My way is the only way"],
  },
  {
    id: "optimism",
    label: "😊 Positive Optimism",
    examples: ["Everything goes wrong", "Life is against me", "Nothing good ever happens"],
  },
  {
    id: "problemSolving",
    label: "💡 Problem Solving",
    examples: ["I can't solve problems", "I'm not smart enough", "Everything is too complicated"],
  },
  {
    id: "purpose",
    label: "🧭 Purpose",
    examples: ["I have no purpose", "My life is meaningless", "I'm just drifting"],
  },
  {
    id: "quality",
    label: "🏄‍♂️ Quality of Life",
    examples: ["My life is a mess", "I can't enjoy anything", "Nothing ever improves"],
  },
  {
    id: "resilience",
    label: "💪 Resilience",
    examples: ["I give up too easily", "I can't handle challenges", "I'm too weak"],
  },
  {
    id: "business",
    label: "💼 Running a Business",
    examples: ["My business will fail", "I'm not a good entrepreneur", "I can't handle business"],
  },
  {
    id: "selfLove",
    label: "💖 Self-Love",
    examples: ["I don't deserve love", "I hate myself", "I'm not worthy"],
  },
  {
    id: "social",
    label: "💞 Social Life & Relationships",
    examples: ["I'm socially awkward", "Nobody likes me", "I can't make friends"],
  },
  {
    id: "learning",
    label: "🤓 Speed Learning",
    examples: ["I'm a slow learner", "I can't retain information", "Learning is too hard"],
  },
  {
    id: "spirituality",
    label: "🦋 Spirituality",
    examples: ["I lack spiritual connection", "I'm not spiritual enough", "I feel empty inside"],
  },
  {
    id: "relationships",
    label: "💌 Strengthening Relationships",
    examples: ["My relationships always fail", "I can't maintain connections", "I push people away"],
  },
  {
    id: "character",
    label: "🏅 Strength of Character",
    examples: ["I'm weak-willed", "I lack integrity", "I can't stand up for myself"],
  },
  {
    id: "teaching",
    label: "🧑‍🏫 Teaching & Training",
    examples: ["I'm a bad teacher", "I can't explain things", "Nobody learns from me"],
  },
  {
    id: "vision",
    label: "🔭 Vision",
    examples: ["I lack vision", "I can't see the future", "I have no direction"],
  },
  {
    id: "wellness",
    label: "🌿 Wellness",
    examples: ["I'll never be healthy", "My body is weak", "I can't take care of myself"],
  }
];

interface AffirmationWizardProps {
  onAffirmationsGenerated: (affirmations: string[]) => void;
}

export function AffirmationWizard({ onAffirmationsGenerated }: AffirmationWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [negativeThought, setNegativeThought] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAffirmations, setGeneratedAffirmations] = useState<string[]>([]);
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);
  const { toast } = useToast();

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setStep(2);
  };

  const generateCustomAffirmations = (negativeThought: string, baseAffirmations: string[] = []): string[] => {
    const customPrefixes = [
      "I am capable of",
      "I choose to be",
      "I embrace being",
      "I deserve to be",
      "I am becoming",
      "I naturally attract",
      "I confidently",
      "I joyfully",
      "I easily",
      "I powerfully"
    ];
    
    const positiveThought = negativeThought
      .toLowerCase()
      .replace(/^i am/, '')
      .replace(/^i'm/, '')
      .replace(/^i/, '')
      .trim()
      .replace(/never|not|can't|cannot|won't|don't/g, '')
      .replace(/fail/g, 'succeed')
      .replace(/weak/g, 'strong')
      .replace(/bad/g, 'good')
      .replace(/hate/g, 'love')
      .replace(/fear/g, 'embrace')
      .replace(/impossible/g, 'possible')
      .replace(/difficult/g, 'achievable')
      .trim();

    const customAffirmations = customPrefixes.map(prefix => 
      `${prefix} ${positiveThought}`
    );
    
    const allAffirmations = [...baseAffirmations, ...customAffirmations];
    const uniqueAffirmations = Array.from(new Set(allAffirmations));
    
    return uniqueAffirmations;
  };

  const handleNegativeThoughtSubmit = async () => {
    if (!negativeThought.trim() && step === 2) {
      toast({
        description: "Please enter your negative thought or trigger",
        variant: "destructive",
        duration: 3000,
        className: "bg-zinc-800 text-white border-none",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { generateSimilarPhrases } = await import('@/lib/localAffirmationGenerator');
      let affirmations = await generateSimilarPhrases(negativeThought, selectedCategory);
      
      if (!affirmations || affirmations.length === 0) {
        throw new Error("Failed to generate affirmations");
      }

      // Generate custom affirmations if in custom category
      if (selectedCategory === 'custom') {
        affirmations = generateCustomAffirmations(negativeThought, affirmations);
      }

      // Filter to ensure all affirmations start with "I" and are unique
      const processedAffirmations = Array.from(new Set(
        affirmations
          .filter(a => a.trim().startsWith('I '))
          .map(a => a.trim())
          .filter(Boolean)
      )).slice(0, 15); // Limit to 15 affirmations for better readability

      if (processedAffirmations.length < 3) {
        throw new Error("Not enough valid affirmations generated");
      }

      setGeneratedAffirmations(processedAffirmations);
      onAffirmationsGenerated(processedAffirmations);
      setStep(3);
      
      toast({
        description: "Affirmations generated successfully",
        duration: 2000,
        className: "bg-zinc-800 text-white border-none",
      });
    } catch (error: any) {
      console.error('Affirmation generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate affirmations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">Build Affirmations</CardTitle>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-white">What behavior would you like to change?</Label>
            <Select onValueChange={handleCategorySelect}>
              <SelectTrigger className="bg-zinc-800 text-white border-zinc-600">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600">
                {BEHAVIOR_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-white">
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label className="text-white">
              {selectedCategory === 'custom' 
                ? "Type the negative self-talk you want to change:"
                : "What negative thought or trigger would you like to address?"
              }
            </Label>
            <div className="space-y-2">
              <Input
                value={negativeThought}
                onChange={(e) => setNegativeThought(e.target.value)}
                className="bg-zinc-800 text-white border-zinc-600"
                placeholder="Enter your negative thought..."
              />
              <div className="text-sm text-zinc-400">
                {selectedCategory === 'custom' ? "Examples of negative self-talk to transform:" : "Examples:"}
                {BEHAVIOR_CATEGORIES.find((c) => c.id === selectedCategory)?.examples.map(
                  (example, index) => (
                    <span key={index} className="block ml-2">• {example}</span>
                  )
                )}
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setStep(1)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
                title="Back to Categories"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNegativeThoughtSubmit}
                disabled={isGenerating}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
                title={isGenerating ? "Generating..." : "Generate Affirmations"}
              >
                {isGenerating ? (
                  <span className="animate-spin">
                    <RotateCw className="h-4 w-4" />
                  </span>
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                {BEHAVIOR_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </h3>
              <Label className="text-zinc-400">
                Your Personalized Affirmations
              </Label>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {generatedAffirmations.map((affirmation, index) => (
                <div
                  key={index}
                  className="p-3 rounded bg-zinc-800/50 border border-zinc-700"
                >
                  <p className="text-white">
                    {affirmation}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setStep(1)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
                title="Back to Categories"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNegativeThoughtSubmit}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
                title="Regenerate Affirmations"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
