import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
    id: "confidence",
    label: "Build Confidence",
    examples: ["I'm not good enough", "I feel insecure", "People won't like me"],
  },
  {
    id: "productivity",
    label: "Boost Productivity",
    examples: ["I always procrastinate", "I can't focus", "I'm too disorganized"],
  },
  {
    id: "health",
    label: "Improve Health",
    examples: ["I'm always tired", "I can't stick to healthy habits", "I feel drained"],
  },
  {
    id: "relationships",
    label: "Enhance Relationships",
    examples: ["I feel lonely", "I struggle to connect", "I fear rejection"],
  },
  {
    id: "mindfulness",
    label: "Practice Mindfulness",
    examples: ["My mind is always racing", "I can't stay present", "I'm too stressed"],
  },
  {
    id: "success",
    label: "Achieve Success",
    examples: ["I keep failing", "Success feels impossible", "I doubt my abilities"],
  },
  {
    id: "creativity",
    label: "Boost Creativity",
    examples: ["I'm not creative enough", "I feel blocked", "My ideas are boring"],
  },
  {
    id: "growth",
    label: "Personal Growth",
    examples: ["I'm stuck in life", "I fear change", "I'm not growing"],
  },
  {
    id: "resilience",
    label: "Build Resilience",
    examples: ["I give up too easily", "I can't handle challenges", "I feel weak"],
  },
  {
    id: "abundance",
    label: "Attract Abundance",
    examples: ["I never have enough", "Money is scarce", "I lack resources"],
  },
  {
    id: "career",
    label: "Career Growth",
    examples: ["I'm stuck in my career", "I'm undervalued", "I lack direction"],
  },
  {
    id: "custom",
    label: "Custom Affirmations",
    examples: ["Enter your own situation", "Describe what you want to change"],
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

  const handleNegativeThoughtSubmit = async () => {
    if (!negativeThought.trim() && step === 2) {
      toast({
        title: "Error",
        description: "Please enter your negative thought or trigger",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { generateSimilarPhrases } = await import('@/lib/localAffirmationGenerator');
      const affirmations = await generateSimilarPhrases(negativeThought, selectedCategory);
      
      if (!affirmations || affirmations.length === 0) {
        throw new Error("Failed to generate affirmations");
      }

      // Filter to ensure all affirmations start with "I"
      const processedAffirmations = affirmations
        .filter(a => a.startsWith('I '))
        .slice(0, 15); // Limit to 15 affirmations for better readability

      setGeneratedAffirmations(processedAffirmations);
      onAffirmationsGenerated(processedAffirmations);
      setStep(3);
      
      toast({
        title: "Success",
        description: "Affirmations generated successfully",
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
        <CardTitle className="text-white">Create Your Affirmations</CardTitle>
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
              What negative thought or trigger would you like to address?
            </Label>
            <div className="space-y-2">
              <Input
                value={negativeThought}
                onChange={(e) => setNegativeThought(e.target.value)}
                className="bg-zinc-800 text-white border-zinc-600"
                placeholder="Enter your negative thought..."
              />
              <div className="text-sm text-zinc-400">
                Examples:
                {BEHAVIOR_CATEGORIES.find((c) => c.id === selectedCategory)?.examples.map(
                  (example, index) => (
                    <span key={index} className="block ml-2">• {example}</span>
                  )
                )}
              </div>
            </div>
            <Button
              onClick={handleNegativeThoughtSubmit}
              disabled={isGenerating}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              {isGenerating ? "Generating Affirmations..." : "Generate Affirmations"}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label className="text-white">
              Your Personalized Affirmations
            </Label>
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
            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Back to Categories
              </Button>
              <Button
                onClick={handleNegativeThoughtSubmit}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Regenerate Affirmations
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
