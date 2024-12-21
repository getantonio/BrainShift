import { AudioRecorder } from "@/components/AudioRecorder";
import { PlaylistManager } from "@/components/PlaylistManager";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="py-4 px-8 text-center text-3xl font-bold border-b border-white/20 shadow-lg bg-black">
        <h1 className="font-extrabold tracking-wider">
          Brain Wave Studio
        </h1>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <AudioRecorder />
        <PlaylistManager />
      </main>
    </div>
  );
}
