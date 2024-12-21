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
    id: "smoking",
    label: "Quit Smoking",
    examples: ["I don't care if it kills me", "Just one won't hurt"],
  },
  {
    id: "confidence",
    label: "Build Confidence",
    examples: ["I'm not good enough", "People won't like me"],
  },
  {
    id: "procrastination",
    label: "Stop Procrastinating",
    examples: ["I'll do it later", "I work better under pressure"],
  },
  {
    id: "fitness",
    label: "Be More Active",
    examples: ["I'm too tired to exercise", "I don't have time for the gym"],
  },
];

interface AffirmationWizardProps {
  onAffirmationsGenerated: (affirmations: string[]) => void;
}

export function AffirmationWizard({ onAffirmationsGenerated }: AffirmationWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [negativeThought, setNegativeThought] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setStep(2);
  };

  const handleNegativeThoughtSubmit = async () => {
    if (!negativeThought.trim()) {
      toast({
        title: "Error",
        description: "Please enter your negative thought or trigger",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      setIsGenerating(true);
      
      const { generateSimilarPhrases } = await import('@/lib/localAffirmationGenerator');
      const affirmations = await generateSimilarPhrases(negativeThought, selectedCategory);
      
      if (!affirmations || affirmations.length === 0) {
        throw new Error("Failed to generate affirmations");
      }

      onAffirmationsGenerated(affirmations);
      setStep(3);
      
      toast({
        title: "Success",
        description: "Affirmations generated successfully using local AI model",
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
      </CardContent>
    </Card>
  );
}
