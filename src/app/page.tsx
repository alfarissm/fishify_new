
'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Search, Loader2, X, Play, Pause, SkipBack, SkipForward, ExternalLink, Terminal, ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRecommendations } from './actions';
import type { ActionState, Song } from '@/types';
import { ThemeToggle } from '@/components/theme-toggle';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const initialState: ActionState = {
  recommendations: [],
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="icon"
      className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 transition hover:brightness-110 active:scale-95 disabled:opacity-60"
      disabled={pending}
      aria-label="Search"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
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
    <div className="w-full max-w-sm md:sticky md:top-8 animate-in fade-in-50 slide-in-from-bottom-4 md:slide-in-from-right-4 duration-700">
      <div className="relative rounded-[1.75rem] border border-foreground/10 bg-card/70 p-5 shadow-2xl backdrop-blur-xl">
        <button
          onClick={onClose}
          aria-label="Close player"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/40 text-foreground/60 backdrop-blur transition-colors hover:bg-background/70 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Artwork */}
        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-foreground/10">
          <Image
            src={song.imageUrl}
            alt={`${song.name} by ${song.artist}`}
            width={600}
            height={600}
            className="h-full w-full object-cover"
            data-ai-hint="album cover"
            priority
          />
        </div>

        {/* Track meta */}
        <div className="mt-5 text-center">
          <h2 className="font-headline text-xl font-bold tracking-tight text-balance text-foreground">{song.name}</h2>
          <p className="mt-1 text-sm font-medium text-primary">{song.artist}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{song.album}</p>
        </div>

        {/* Scrubber */}
        <div className="mt-5">
          <Progress value={progress} className="h-1.5" />
          <div className="mt-1.5 flex justify-between font-code text-[11px] tabular-nums text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingTime > 0 ? remainingTime : 0)}</span>
          </div>
        </div>

        {/* Transport */}
        <div className="mt-4 flex items-center justify-center gap-7">
          <button onClick={onPrev} aria-label="Previous track" className="text-foreground/70 transition-transform hover:text-foreground active:scale-90">
            <SkipBack className="h-6 w-6 fill-current" />
          </button>
          <button
            onClick={onPlayPause}
            disabled={!song.previewUrl}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
          >
            {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-0.5 h-7 w-7 fill-current" />}
          </button>
          <button onClick={onNext} aria-label="Next track" className="text-foreground/70 transition-transform hover:text-foreground active:scale-90">
            <SkipForward className="h-6 w-6 fill-current" />
          </button>
        </div>

        {!song.previewUrl && (
          <p className="mt-4 text-center text-xs text-muted-foreground">No 30-second preview available for this track.</p>
        )}

        {/* Apple Music link */}
        <a
          href={song.trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
        >
          Listen on Apple Music
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

function RecommendationSkeleton() {
  return (
    <div className="w-full max-w-xl mt-2 md:mt-0">
      <div className="flex flex-col gap-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-2">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-3 w-9" />
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
    <div className="relative flex min-h-screen overflow-hidden bg-background transition-colors duration-500">
      {/* Ambient artwork backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {selectedSong && (
          <Image
            key={selectedSong.id}
            src={selectedSong.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="ambient-layer scale-125 object-cover opacity-40 blur-[120px] saturate-150 animate-in fade-in duration-1000 dark:opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 pt-16">
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
              hasSearched ? 'h-0 opacity-0' : 'h-44 opacity-100 mb-8'
            )}>
              <h1 className="font-headline text-5xl sm:text-6xl font-extrabold tracking-tighter text-balance text-foreground">Fishify</h1>
              <p className="mx-auto mt-3 max-w-md text-balance text-lg text-muted-foreground">
                Describe a mood, an activity, or a song you love. We&apos;ll find the perfect soundtrack.
              </p>
            </header>

            {/* Search Bar */}
            <div className="w-full px-4 mb-8">
              <form
                action={handleFormAction}
                className="flex items-center w-full rounded-full border border-foreground/10 bg-card/60 p-1.5 pl-5 shadow-lg backdrop-blur-xl transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  name="prompt"
                  placeholder="rainy day, workout, songs like NIKI…"
                  className="flex-1 border-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
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
              <section className="w-full max-w-xl animate-in fade-in-50 duration-500 mt-2 md:mt-0">
                <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {state.recommendations.length} tracks for you
                </h2>
                <div className="flex flex-col gap-0.5">
                  {state.recommendations.map((song, i) => {
                    const isActive = selectedSong?.id === song.id;
                    const isNowPlaying = isActive && isPlaying;
                    return (
                      <button
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors animate-in fade-in-50 slide-in-from-bottom-1 fill-mode-both duration-500",
                          isActive ? 'bg-foreground/10' : 'hover:bg-foreground/5'
                        )}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-foreground/10">
                          <Image
                            src={song.imageUrl}
                            alt={`${song.name} by ${song.artist}`}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            data-ai-hint="album cover"
                          />
                          {isNowPlaying && (
                            <div className="absolute inset-0 flex items-end justify-center gap-0.5 bg-black/40 pb-2.5">
                              <span className="eq-bar h-3" />
                              <span className="eq-bar h-4" />
                              <span className="eq-bar h-2.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <h3 className={cn("truncate text-sm font-semibold", isActive ? 'text-primary' : 'text-foreground group-hover:text-primary')}>{song.name}</h3>
                          <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                        </div>
                        <span className="ml-2 shrink-0 font-code text-xs tabular-nums text-muted-foreground">{song.duration}</span>
                      </button>
                    );
                  })}
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
