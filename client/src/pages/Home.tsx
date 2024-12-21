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
            className="w-8 h-8 text-pink-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {/* Left hemisphere */}
            <path
              d="M12 4C8 4 5 7 5 11C5 15 8 18 12 18"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right hemisphere */}
            <path
              d="M12 4C16 4 19 7 19 11C19 15 16 18 12 18"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Brain folds - left */}
            <path
              d="M7 8C9 9 9 13 7 14"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Brain folds - right */}
            <path
              d="M17 8C15 9 15 13 17 14"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Neural connections */}
            <path
              d="M9 11C10 11 10 13 9 13M15 11C14 11 14 13 15 13"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Stem */}
            <path
              d="M12 18V20"
              className="text-pink-500"
              stroke="currentColor"
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
