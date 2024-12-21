import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AudioVisualizer } from "./AudioVisualizer";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Settings2 } from "lucide-react";

interface AudioRecorderProps {
  currentCategory: string;
}

export function AudioRecorder({ currentCategory }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      source.connect(analyser);
      
      setAudioContext(context);
      setAnalyserNode(analyser);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
          
          // Convert blob to base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert audio to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          // Verify the audio can be played
          const verificationAudio = new Audio(base64Data);
          await new Promise((resolve, reject) => {
            verificationAudio.oncanplaythrough = resolve;
            verificationAudio.onerror = () => reject(new Error('Invalid audio data'));
            setTimeout(() => reject(new Error('Audio load timeout')), 5000);
          });
          
          const fileName = prompt('Enter a name for your recording:', 'New Recording');
          if (!fileName) {
            audioChunks.current = [];
            return;
          }

          // Use the base64 data as the URL
          const event = new CustomEvent('newRecording', {
            detail: {
              name: fileName,
              url: base64Data,
              category: currentCategory || 'custom'
            }
          });

          console.log('Dispatching recording event:', { 
            name: fileName, 
            category: currentCategory || 'custom',
            dataLength: base64Data.length
          });

          window.dispatchEvent(event);
          
          toast({
            title: "Recording saved",
            description: `${fileName} has been added to the ${currentCategory} playlist`
          });
        } catch (error) {
          console.error('Error saving recording:', error);
          toast({
            title: "Error",
            description: "Failed to save recording. Please try again.",
            variant: "destructive"
          });
        } finally {
          audioChunks.current = [];
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <Card className="bg-zinc-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Record Audio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-4 mb-4">
          <Button
            onClick={startRecording}
            disabled={isRecording}
            variant="outline"
            size="sm"
            className="bg-pink-500 hover:bg-pink-600 text-white border-0 transition-all duration-300 shadow-lg hover:shadow-pink-500/50"
          >
            <Mic className="h-6 w-6" />
          </Button>
          <Button
            onClick={stopRecording}
            disabled={!isRecording}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-100 text-black border-0 transition-all duration-300"
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>
        
        <AudioVisualizer
          isRecording={isRecording}
          analyserNode={analyserNode}
        />
      </CardContent>
    </Card>
  );
}