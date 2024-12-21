import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, Timer, VolumeX, Leaf, Target } from "lucide-react";

export function HypnosisGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const techniques = [
    {
      title: "Set Your Intention",
      icon: <Target className="h-5 w-5" />,
      content: "Decide what you want to achieve: more motivation, increased confidence, or a specific goal. The clearer your intention, the more effective the session."
    },
    {
      title: "Choose a Quiet Environment",
      icon: <VolumeX className="h-5 w-5" />,
      content: "Find a calm, comfortable place where you won't be disturbed. Use dim lighting or calming music if it helps. A peaceful environment enhances the effectiveness of your session."
    },
    {
      title: "Relaxation Process",
      icon: <Leaf className="h-5 w-5" />,
      content: "Take deep breaths: Inhale for 4 seconds, hold for 4 seconds, and exhale for 6 seconds. Progressively relax your muscles from head to toe, imagining tension melting away from each part of your body."
    },
    {
      title: "Mental Focus & Visualization",
      icon: <Brain className="h-5 w-5" />,
      content: "Close your eyes and picture a peaceful scene, like a beach or forest. Use a mental anchor, such as counting down from 10 to 1, to deepen your relaxation. Engage all your senses to make the visualization as real as possible."
    },
    {
      title: "Voice Recording Techniques",
      icon: <Lightbulb className="h-5 w-5" />,
      content: "Speak slowly and softly, as if comforting a close friend. Include pauses to allow your subconscious to absorb the messages. Use phrases like 'You are calm and focused' or 'Your energy is boundless.' Add soft, meditative music or nature sounds to enhance relaxation."
    },
    {
      title: "Building a Practice",
      icon: <Timer className="h-5 w-5" />,
      content: "Start with 5-10 minute sessions and gradually increase duration. Practice daily for best results. Begin each day with a short session to set a positive tone. Combine self-hypnosis with small, achievable steps toward your goals to build momentum and confidence."
    }
  ];

  return (
    <Card className="bg-zinc-900/50 border-zinc-700 mt-8">
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-white font-display text-2xl">Self-Hypnosis Guide</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-white hover:text-zinc-300"
        >
          {isExpanded ? "Hide Guide" : "Show Guide"}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {techniques.map((technique, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-zinc-700">
                <AccordionTrigger className="text-white hover:text-zinc-300 font-display">
                  <div className="flex items-center gap-3">
                    {technique.icon}
                    <span>{technique.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-300">
                  {technique.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      )}
    </Card>
  );
}
