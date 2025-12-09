
'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Search, Loader2, X, Play, Pause, SkipBack, SkipForward, ExternalLink, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRecommendations } from './actions';
import type { ActionState, Song } from '@/types';
import { ThemeToggle } from '@/components/theme-toggle';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardFooter, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const initialState: ActionState = {
  recommendations: [],
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="icon" className="hover:bg-transparent text-muted-foreground hover:text-primary rounded-full" disabled={pending}>
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Search className="h-5 w-5" />
      )}
    </Button>
  );
}

const PREVIEW_DURATION = 30; // Preview duration in seconds

const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function MusicPlayerPreview({
  song,
  onClose,
  onNext,
  onPrev,
  isPlaying,
  onPlayPause,
  progress,
  currentTime
}: {
  song: Song;
  onClose: () => void,
  onNext: () => void,
  onPrev: () => void,
  isPlaying: boolean,
  onPlayPause: () => void,
  progress: number,
  currentTime: number
}) {
  const remainingTime = PREVIEW_DURATION - currentTime;

  return (
    <Card className="w-full max-w-sm rounded-xl bg-card text-card-foreground shadow-2xl animate-in fade-in-50 slide-in-from-right-5 duration-500 flex flex-col mt-8 md:mt-0 overflow-hidden border-0">
      <CardHeader className="p-0 relative h-64">
        <Image
          src={song.imageUrl}
          alt={`${song.name} by ${song.artist}`}
          width={300}
          height={300}
          className="w-full h-full object-cover"
          data-ai-hint="album cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-2 right-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="w-full px-2">
            <Progress value={progress} className="h-1 bg-white/20" />
            <div className="flex justify-between text-xs font-mono text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(remainingTime > 0 ? remainingTime : 0)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 w-full mt-2">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onPrev}>
              <SkipBack className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 rounded-full bg-white/90 text-black hover:bg-white disabled:bg-white/50 disabled:cursor-not-allowed"
              onClick={onPlayPause}
              disabled={!song.previewUrl}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onNext}>
              <SkipForward className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="font-headline">{song.name}</CardTitle>
        <CardDescription>{song.artist} • {song.album}</CardDescription>
        {!song.previewUrl && (
          <Alert variant="default" className="mt-4 text-xs bg-secondary">
             <AlertDescription>
              No 30s preview available for this track on Spotify.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center bg-card/50">
        <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="outline" className="w-full">
            Listen on Spotify
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </CardFooter>
    </Card>
  )
}

function RecommendationSkeleton() {
  return (
    <div className="w-full max-w-xl animate-pulse mt-4 md:mt-0">
      <div className="flex flex-col">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center p-1.5 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-md mr-3" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-10 ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [state, formAction] = useActionState(getRecommendations, initialState);
  const { pending } = useFormStatus();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleNextSong = () => {
    if (!selectedSong || state.recommendations.length === 0) return;
    const currentIndex = state.recommendations.findIndex(s => s.id === selectedSong.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    for (let i = 0; i < state.recommendations.length; i++) {
        nextIndex = (nextIndex + 1) % state.recommendations.length;
        const nextSong = state.recommendations[nextIndex];
        if (nextSong.previewUrl) {
            handleSelectSong(nextSong, true);
            return;
        }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
        if (audio) {
            setCurrentTime(audio.currentTime);
        }
    };
    
    const handleSongEnd = () => {
        setIsPlaying(false);
        handleNextSong();
    };

    if (audio) {
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleSongEnd);
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
    }

    return () => {
        if (audio) {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleSongEnd);
            audio.removeEventListener('play', () => setIsPlaying(true));
            audio.removeEventListener('pause', () => setIsPlaying(false));
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef.current]);

  const playSong = (song: Song, autoPlay: boolean) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    if (song.previewUrl) {
      const newAudio = new Audio(song.previewUrl);
      newAudio.volume = 0.5;
      audioRef.current = newAudio;
      
      if (autoPlay) {
        newAudio.play().catch(e => {
          console.error("Audio play failed:", e)
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current = null;
    }
    
    setCurrentTime(0);
    setIsPlaying(autoPlay && !!song.previewUrl);
  };


  useEffect(() => {
    if (state.recommendations.length > 0 && !selectedSong) {
       handleSelectSong(state.recommendations[0], false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.recommendations]);


  const handleFormAction: (payload: FormData) => void = (payload) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSelectedSong(null);
    setHasSearched(true);
    formAction(payload);
  };

  const handleSelectSong = (song: Song, autoPlay = true) => {
    setSelectedSong(song);
    playSong(song, autoPlay);
  };

  const handleClosePlayer = () => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    setSelectedSong(null);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
  
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }

  const findAdjacentSong = (direction: 'next' | 'prev'): Song | null => {
    if (!selectedSong) return null;
    const { recommendations } = state;
    if (recommendations.length < 2) return null;
    
    const currentIndex = recommendations.findIndex(s => s.id === selectedSong.id);
    if (currentIndex === -1) return null;
    let nextIndex = currentIndex;

    for (let i = 0; i < recommendations.length; i++) {
      if (direction === 'next') {
        nextIndex = (nextIndex + 1) % recommendations.length;
      } else {
        nextIndex = (nextIndex - 1 + recommendations.length) % recommendations.length;
      }
      
      if (recommendations[nextIndex].previewUrl) {
        return recommendations[nextIndex];
      }
      if (nextIndex === currentIndex) break;
    }
    return null;
  }

  const handleNextWithCheck = () => {
    const nextSong = findAdjacentSong('next');
    if (nextSong) {
      handleSelectSong(nextSong, true);
    }
  };

  const handlePrevSong = () => {
    const prevSong = findAdjacentSong('prev');
    if (prevSong) {
      handleSelectSong(prevSong, true);
    }
  };

  const progress = audioRef.current ? (currentTime / PREVIEW_DURATION) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-500">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-16">
        <div className={cn(
          "flex w-full max-w-6xl transition-all duration-500 ease-in-out",
          hasSearched ? 'flex-col md:flex-row items-start gap-8' : 'flex-col items-center'
        )}>
          {/* Content Column (Search, Recommendations, Player on Mobile) */}
          <div className={cn(
            "flex flex-col items-center w-full transition-all duration-500 ease-in-out",
            hasSearched ? 'md:max-w-xl' : 'max-w-xl',
          )}>
            <header className={cn(
              "text-center transition-all duration-500 ease-in-out overflow-hidden",
              hasSearched ? 'h-0 opacity-0' : 'h-40 opacity-100 mb-8'
            )}>
              <h1 className="text-4xl sm:text-5xl font-bold text-primary font-headline">Fishify</h1>
              <p className="text-muted-foreground mt-2 text-lg max-w-md mx-auto">
                Tell us your mood, an activity, or a song you like. We&apos;ll find the perfect soundtrack.
              </p>
            </header>

            {/* Search Bar */}
            <div className="w-full px-4 mb-8">
              <form action={handleFormAction} className="flex items-center w-full bg-input rounded-full p-1 border focus-within:border-primary transition-colors">
                <Input
                  name="prompt"
                  placeholder="e.g., 'rainy day', 'workout', 'NIKI'"
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                  required
                />
                <SubmitButton />
              </form>
              {state.error && (
                 <Alert variant="destructive" className="mt-4">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    {state.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Mobile Player View */}
            <div className={cn("w-full md:hidden", selectedSong ? 'block' : 'hidden')}>
              {selectedSong && <MusicPlayerPreview song={selectedSong} onClose={handleClosePlayer} onNext={handleNextWithCheck} onPrev={handlePrevSong} isPlaying={isPlaying} onPlayPause={handlePlayPause} progress={progress} currentTime={currentTime} />}
            </div>

            {/* Recommendations List */}
            {pending && <RecommendationSkeleton />}
            {!pending && state.recommendations.length > 0 && (
              <section className="w-full max-w-xl animate-in fade-in-50 duration-500 mt-4 md:mt-0">
                <div className="flex flex-col">
                  {state.recommendations.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className={cn(
                        "flex items-center p-1.5 rounded-lg hover:bg-card transition-all group text-left w-full",
                        selectedSong?.id === song.id && 'bg-card'
                      )}
                    >
                      <Image
                        src={song.imageUrl}
                        alt={`${song.name} by ${song.artist}`}
                        width={32}
                        height={32}
                        className="rounded-md mr-3"
                        data-ai-hint="album cover"
                      />
                      <div className="flex-grow">
                        <h3 className={cn("font-semibold text-sm text-foreground", selectedSong?.id === song.id ? 'text-primary' : 'group-hover:text-primary')}>{song.name}</h3>
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4">{song.duration}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Desktop Player Column */}
          <div className="hidden md:flex flex-1 justify-center w-full md:w-auto">
            {selectedSong && <MusicPlayerPreview song={selectedSong} onClose={handleClosePlayer} onNext={handleNextWithCheck} onPrev={handlePrevSong} isPlaying={isPlaying} onPlayPause={handlePlayPause} progress={progress} currentTime={currentTime} />}
          </div>
        </div>
      </main>

      {/* Watermark */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 text-center py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors bg-background/50 backdrop-blur-sm">
        Project by Alfaris
      </footer>
    </div>
  );
}
