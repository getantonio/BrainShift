import { AudioRecorder } from "@/components/AudioRecorder";
import { PlaylistManager } from "@/components/PlaylistManager";
import { AffirmationWizard } from "@/components/AffirmationWizard";
import { HypnosisGuide } from "@/components/HypnosisGuide";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Home() {
  const { colors } = useTheme();
  const [arePlaylistsCollapsed, setArePlaylistsCollapsed] = useState(false);

  const [generatedAffirmations, setGeneratedAffirmations] = useState<string[]>([]);

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: colors?.body?.background || '#18181B',
        color: colors?.body?.text || '#FFFFFF'
      }}
    >
      <header 
        className="py-4 px-8 text-center text-3xl font-bold shadow-lg"
        style={{ 
          backgroundColor: '#18181B',
          borderBottom: `1px solid ${colors?.header?.border || 'rgba(255, 255, 255, 0.2)'}`,
          color: colors?.header?.text || '#FFFFFF'
        }}
      >
        <h1 className="font-extrabold tracking-wider">
          Brain Wave Studio
        </h1>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <AffirmationWizard onAffirmationsGenerated={setGeneratedAffirmations} />
        <AudioRecorder />
        <HypnosisGuide />
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
        <PlaylistManager allCollapsed={arePlaylistsCollapsed} />
      </main>
    </div>
  );
}
