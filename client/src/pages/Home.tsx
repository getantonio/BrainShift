import { AudioRecorder } from "@/components/AudioRecorder";
import { PlaylistManager } from "@/components/PlaylistManager";
import { ColorCustomizer } from "@/components/ColorCustomizer";
import { useTheme } from "@/lib/theme-context";

export default function Home() {
  const { colors } = useTheme();

  return (
    <div 
      className="min-h-screen text-white"
      style={{ 
        background: colors.background,
        color: colors.foreground 
      }}
    >
      <header 
        className="py-4 px-8 text-center text-3xl font-bold border-b shadow-lg"
        style={{
          borderColor: `${colors.foreground}20`,
          background: colors.background
        }}
      >
        <h1 className="font-extrabold tracking-wider">
          Brain Wave Studio
        </h1>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <AudioRecorder />
        <PlaylistManager />
        <ColorCustomizer />
      </main>
    </div>
  );
}
