import { AudioRecorder } from "@/components/AudioRecorder";
import { PlaylistManager } from "@/components/PlaylistManager";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <header className="bg-black/70 py-4 px-8 text-center text-3xl font-bold border-b-2 border-gray-700 shadow-lg">
        <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Audio Sketch Studio
        </h1>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <AudioRecorder />
        <PlaylistManager />
      </main>
    </div>
  );
}
