import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb, Timer, VolumeX, Leaf, Target } from "lucide-react";

export function HypnosisGuide() {
  const techniques = [
    {
      title: "Set Your Intention",
      icon: <Target className="h-5 w-5" />,
      content: "Decide what you want to achieve: more motivation, increased confidence, or a specific goal. The clearer your intention, the more effective the session."
    },
    {
      title: "Find Your Space",
      icon: <VolumeX className="h-5 w-5" />,
      content: "Choose a quiet, comfortable environment where you won't be disturbed. Use dim lighting or calming music if it helps."
    },
    {
      title: "Relaxation Technique",
      icon: <Leaf className="h-5 w-5" />,
      content: "Take deep breaths: Inhale for 4 seconds, hold for 4 seconds, and exhale for 6 seconds. Progressively relax your muscles from head to toe."
    },
    {
      title: "Mental Focus",
      icon: <Brain className="h-5 w-5" />,
      content: "Close your eyes and picture a peaceful scene. Use a mental anchor, such as counting down from 10 to 1, to deepen your relaxation."
    },
    {
      title: "Voice Recording Tips",
      icon: <Lightbulb className="h-5 w-5" />,
      content: "Speak slowly and softly, as if comforting a close friend. Include pauses to allow your subconscious to absorb the messages."
    },
    {
      title: "Session Duration",
      icon: <Timer className="h-5 w-5" />,
      content: "Start with 5-10 minute sessions and gradually increase as you become more comfortable. Consistency is key - practice daily for best results."
    }
  ];

  return (
    <Card className="bg-zinc-900/50 border-zinc-700 mt-8">
      <CardHeader>
        <CardTitle className="text-white font-display text-2xl">Self-Hypnosis Guide</CardTitle>
      </CardHeader>
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
    </Card>
  );
}
