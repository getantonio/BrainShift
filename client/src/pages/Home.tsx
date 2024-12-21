import { AudioRecorder } from "@/components/AudioRecorder";
import { PlaylistManager } from "@/components/PlaylistManager";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AffirmationWizard } from "@/components/AffirmationWizard";
import { HypnosisGuide } from "@/components/HypnosisGuide";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Home() {
  const { colors } = useTheme();
  const [arePlaylistsCollapsed, setArePlaylistsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [generatedAffirmations, setGeneratedAffirmations] = useState<string[]>([]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} message={loadingMessage} />
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
            {/* Left hemisphere with detailed folds */}
            <path
              d="M12 4C8 4 5 7 5 11C5 15 8 18 12 18C12 18 12 16 12 15C10 15 8 13 8 11C8 9 10 7 12 7C12 6 12 4 12 4Z"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Brain folds - more organic curves */}
            <path
              d="M7 8.5C8 9 8.5 10 8.5 11C8.5 12 8 13 7 13.5"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 10C10 10.5 10.5 11 10 12"
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
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-pink-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {/* Right hemisphere with detailed folds */}
            <path
              d="M12 4C16 4 19 7 19 11C19 15 16 18 12 18C12 18 12 16 12 15C14 15 16 13 16 11C16 9 14 7 12 7C12 6 12 4 12 4Z"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Brain folds - more organic curves */}
            <path
              d="M17 8.5C16 9 15.5 10 15.5 11C15.5 12 16 13 17 13.5"
              className="text-pink-500"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 10C14 10.5 13.5 11 14 12"
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
    </>
  );
}
