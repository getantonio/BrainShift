import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
import { useState, useRef } from "react";
import { AudioVisualizer } from "./AudioVisualizer";
import { useToast } from "@/hooks/use-toast";
import { useAudioContext } from "@/lib/audio-context";

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const { toast } = useToast();
  const { 
    audioContext, 
    analyzerNode, 
    isPlaying, 
    startRecording: startAudioContext,
    stopRecording: stopAudioContext 
  } = useAudioContext();

  const startRecording = async () => {
    try {
      if (!audioContext || !analyzerNode) {
        throw new Error("Audio context not initialized");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create and connect the audio source
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyzerNode);
      
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const fileName = prompt('Enter a name for your recording:', 'New Recording');
        if (!fileName) {
          audioChunks.current = [];
          return;
        }

        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = `${fileName}.mp3`;
        downloadLink.click();
        
        toast({
          title: "Recording saved",
          description: `${fileName}.mp3 has been saved`
        });
        
        // Cleanup
        URL.revokeObjectURL(audioUrl);
        audioChunks.current = [];
      };

      recorder.start();
      startAudioContext();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
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
      
      // Cleanup media recorder and stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Disconnect source if it exists
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      setIsRecording(false);
      setMediaRecorder(null);
      stopAudioContext();
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
        
        <AudioVisualizer
          isRecording={isRecording}
          isPlaying={isPlaying}
          analyserNode={analyzerNode}
        />
      </CardContent>
    </Card>
  );
}