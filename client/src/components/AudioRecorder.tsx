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

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [visualizerColors, setVisualizerColors] = useState(() => {
    const saved = localStorage.getItem('visualizer-colors');
    return saved ? JSON.parse(saved) : {
      primary: '#4ade80',
      secondary: '#2563eb',
      background: '#111827',
      particle: '#ec4899',
      waveform: '#8b5cf6'
    };
  });

  useEffect(() => {
    localStorage.setItem('visualizer-colors', JSON.stringify(visualizerColors));
  }, [visualizerColors]);

  const handleColorChange = (key: keyof typeof visualizerColors) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setVisualizerColors(prev => ({
      ...prev,
      [key]: e.target.value
    }));
  };

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
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const fileName = prompt('Enter a name for your recording:', 'New Recording');
        if (!fileName) {
          audioChunks.current = [];
          return;
        }

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = `${fileName}.mp3`;
        
        // Trigger download
        downloadLink.click();
        
        toast({
          title: "Recording saved",
          description: `${fileName}.mp3 has been downloaded to your computer`
        });
        
        audioChunks.current = [];
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
            size="lg"
            className="bg-white text-black hover:bg-gray-200 border-0 font-semibold"
          >
            <Mic className="mr-2 h-5 w-5" />
            Record
          </Button>
          <Button
            onClick={stopRecording}
            disabled={!isRecording}
            variant="outline"
            size="lg"
            className="bg-gradient-to-r from-red-500 to-red-700 text-white border-0"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop
          </Button>
        </div>
        
        <div className="space-y-4">
          <AudioVisualizer
            isRecording={isRecording}
            analyserNode={analyserNode}
            colors={visualizerColors}
          />
          
          <Collapsible open={showColorSettings} onOpenChange={setShowColorSettings}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-200 border-zinc-600"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Customize Colors
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-4 mt-4">
                {Object.entries(visualizerColors).map(([key, value]) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={key} className="text-white capitalize">
                      {key}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        type="color"
                        value={value}
                        onChange={handleColorChange(key as keyof typeof visualizerColors)}
                        className="w-12 h-12 p-1 bg-transparent border-white/20"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={handleColorChange(key as keyof typeof visualizerColors)}
                        className="flex-1 bg-zinc-800 border-white/20 text-white"
                        placeholder={`Enter ${key} color`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
