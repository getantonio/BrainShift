import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, Timer, VolumeX, Leaf, Target, ChevronDown } from "lucide-react";

export function HypnosisGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const techniques = [
    {
      title: "Understanding Self-Hypnosis",
      icon: <Brain className="h-5 w-5" />,
      content: "Self-hypnosis is a scientifically-proven technique that works by accessing your subconscious mind through deep relaxation and focused attention. When in this receptive state, your mind becomes more open to positive suggestions and behavioral changes. The practice helps reprogram negative thought patterns by bypassing the conscious mind's critical barriers."
    },
    {
      title: "The Power of Your Own Voice",
      icon: <Lightbulb className="h-5 w-5" />,
      content: "Your own voice has a unique psychological impact because it carries personal emotional resonance and bypasses natural resistance to external suggestions. When you record and listen to your own affirmations, your brain processes them differently than external voices, creating stronger neural pathways for positive change."
    },
    {
      title: "Set Your Intention",
      icon: <Target className="h-5 w-5" />,
      content: "Decide what you want to achieve: more motivation, increased confidence, or a specific goal. The clearer your intention, the more effective the session. Your subconscious mind responds best to specific, positive, and present-tense statements."
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
    },
    {
      title: "Subliminal Enhancement",
      icon: <VolumeX className="h-5 w-5" />,
      content: "For enhanced effectiveness, play your recorded affirmations at a very low volume in the background during periods of rest or sleep. This technique leverages your brain's ability to process information even when not consciously aware of it. The subtle exposure to your own voice speaking positive affirmations helps reinforce the desired changes in your subconscious mind. Keep the volume just barely audible for optimal subliminal effect."
    },
    {
      title: "The Science Behind Self-Hypnosis",
      icon: <Brain className="h-5 w-5" />,
      content: "Research shows that self-hypnosis can create lasting changes in neural pathways through neuroplasticity - your brain's ability to form new connections. Regular practice helps rewire negative thought patterns by strengthening positive neural connections while weakening negative ones. This process is enhanced when using your own voice, as it activates both auditory processing and self-recognition areas of the brain simultaneously. The combination of relaxation and focused attention increases theta brainwaves, associated with enhanced learning and memory consolidation."
    }
  ];

  return (
    <Card className="bg-zinc-900/50 border-zinc-700 mt-8">
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <CardTitle className="text-white font-display text-2xl flex items-center gap-2">
            <span className="text-3xl">🧠</span> Self-Hypnosis Guide
          </CardTitle>
        </div>
        <ChevronDown 
          className={`h-6 w-6 text-white hover:text-zinc-300 transition-transform duration-200 cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        />
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
          <div className="mt-6 text-sm text-center">
            <span className="text-zinc-400">Need inspiration? </span>
            <a 
              href="https://www.mindvalley.com/blog/positive-affirmations" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#FF8DC1] hover:text-[#FFA7CF] underline-offset-4 hover:underline transition-colors"
            >
              Learn about creating powerful affirmations →
            </a>
          </div>
        </CardContent>
      )}
    </Card>
  );
}