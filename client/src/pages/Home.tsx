import { AudioRecorder } from "@/components/AudioRecorder";
import { PlaylistManager } from "@/components/PlaylistManager";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Home() {
  const { colors } = useTheme();
  const [arePlaylistsCollapsed, setArePlaylistsCollapsed] = useState(false);

  return (
    <div 
      className="min-h-screen" 
      style={{ background: colors.body.background, color: colors.body.text }}
    >
      <header 
        className="py-4 px-8 text-center text-3xl font-bold shadow-lg"
        style={{ 
          background: colors.header.background,
          borderBottom: `1px solid ${colors.header.border}`,
          color: colors.header.text
        }}
      >
        <h1 className="font-extrabold tracking-wider">
          Brain Wave Studio
        </h1>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArePlaylistsCollapsed(prev => !prev)}
            className="bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-200 border-zinc-600"
          >
            {arePlaylistsCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand All Playlists
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Collapse All Playlists
              </>
            )}
          </Button>
        </div>
        <ThemeCustomizer />
        <AudioRecorder />
        <PlaylistManager allCollapsed={arePlaylistsCollapsed} />
      </main>
    </div>
  );
}
