import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
import { useState, useRef } from "react";
import { AudioVisualizer } from "./AudioVisualizer";
import { useToast } from "@/hooks/use-toast";

export function AudioRecorder() {
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
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const fileName = prompt('Enter a name for your recording:', 'New Recording');
        if (!fileName) {
          audioChunks.current = [];
          return;
        }

        // Get available playlists
        const playlistEvent = new CustomEvent('requestPlaylists', {
          detail: { callback: (playlists: Array<{ id: number; name: string }>) => {
            // Create a mapping of index to playlist ID for easier selection
            const playlistMapping = playlists.map((p, index) => ({
              index: index + 1,
              id: p.id,
              name: p.name
            }));
            
            const playlistOptions = playlistMapping
              .map(p => `${p.index}. ${p.name}`)
              .join('\n');
            
            const playlistChoice = prompt(
              `Choose a playlist to add "${fileName}" to:\n\n${playlistOptions}\n\nEnter the number of the playlist:`,
              '1'
            );

            if (!playlistChoice) {
              toast({
                title: "Cancelled",
                description: "Recording was not saved to any playlist"
              });
              return;
            }

            const selectedIndex = parseInt(playlistChoice);
            const selectedMapping = playlistMapping.find(p => p.index === selectedIndex);
            const selectedPlaylist = selectedMapping ? playlists.find(p => p.id === selectedMapping.id) : undefined;

            if (!selectedPlaylist) {
              toast({
                title: "Error",
                description: "Invalid playlist selection",
                variant: "destructive"
              });
              return;
            }

            const event = new CustomEvent('newRecording', {
              detail: { 
                name: fileName, 
                url: audioUrl,
                playlistId: selectedMapping?.id
              }
            });
            window.dispatchEvent(event);
            toast({
              title: "Recording saved",
              description: `${fileName} has been added to ${selectedPlaylist.name}`
            });
          }}
        });
        window.dispatchEvent(playlistEvent);
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
        
        <AudioVisualizer
          isRecording={isRecording}
          analyserNode={analyserNode}
        />
      </CardContent>
    </Card>
  );
}
