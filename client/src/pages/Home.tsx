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
        <div className="flex items-center justify-center gap-3">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 12L16 8M12 12L8 16M12 12L8 8M12 12L16 16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="font-extrabold tracking-wider">
            Brain Shift Studio
          </h1>
        </div>
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
