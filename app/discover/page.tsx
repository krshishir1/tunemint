"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Heart,
  Share2,
  Clock,
  Shield,
  Coins,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMusicUploadStore } from "@/store/musicStore";
import { useTrackStore } from "@/store/trackStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import createClient from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/loading";
import { WalletWarning } from "@/components/auth/wallet-warning";
import { useAccountStore } from "@/store/userStore";
import { Label } from "@/components/ui/label";

const supabase = createClient();

interface Track {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  mood?: string[];
  duration?: number;
  image_ipfs_cid: string;
  rights?: {
    allowTips: boolean;
    allowCommercial: boolean;
    allowRemixing: boolean;
  };
  account?: {
    name: string;
    wallet_address: string;
  };
}

export default function DiscoverPage() {
  const musicStore = useMusicUploadStore();
  const trackStore = useTrackStore();
  const { account } = useAccountStore();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    genre: "",
    mood: "",
    allowRemixing: false,
    allowCommercial: false,
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trackLikes, setTrackLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});
  const [showWalletWarning, setShowWalletWarning] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("music_uploads")
        .select(`
          *,
          account:account_id (
            name,
            wallet_address
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTracks(data);

      // Fetch likes for all tracks
      const likesPromises = data.map(async (track) => {
        await trackStore.fetchLikes(track.id);
        return {
          id: track.id,
          likes: trackStore.likes,
          isLiked: trackStore.isLiked
        };
      });

      const likesResults = await Promise.all(likesPromises);
      const likesMap = likesResults.reduce((acc, { id, likes, isLiked }) => ({
        ...acc,
        [id]: { count: likes, isLiked }
      }), {});

      setTrackLikes(likesMap);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading tracks..." />;
  }

  const filteredTracks = tracks?.filter((track) => {
    if (filters.genre && track.genre !== filters.genre) return false;
    if (filters.mood && !track.mood?.includes(filters.mood)) return false;
    if (filters.allowRemixing && !track.rights?.allowRemixing) return false;
    if (filters.allowCommercial && !track.rights?.allowCommercial) return false;
    if (filters.search && !track.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handlePlayPause = (trackId: string) => {
    if (isPlaying === trackId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(trackId);
    }
  };

  const handleLike = async (trackId: string) => {
    await trackStore.toggleLike(trackId);
  };

  const handleShare = async (track: any) => {
    try {
      await navigator.share({
        title: track.title,
        text: `Check out ${track.title} by ${track.account?.name}`,
        url: window.location.origin + `/track/${track.id}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleAction = (action: () => void) => {
    if (!account) {
      setShowWalletWarning(true);
      return;
    }
    action();
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  function cidToUrl(id: string) {
    return `${process.env.NEXT_PUBLIC_PINATA_URL}/${id}`;
  }

  const renderActionButtons = (track: Track) => (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        className="border border-black text-black hover:bg-black hover:text-white font-black text-xs px-2 py-1 rounded-none"
        onClick={(e) => {
          e.preventDefault();
          handleAction(() => handleLike(track.id));
        }}
      >
        <Heart className="w-3 h-3 mr-1" />
        {trackLikes[track.id]?.count || 0}
      </Button>
      <Button
        variant="outline"
        className="border border-black text-black hover:bg-black hover:text-white font-black text-xs px-2 py-1 rounded-none"
        onClick={(e) => {
          e.preventDefault();
          handleAction(() => handleShare(track));
        }}
      >
        <Share2 className="w-3 h-3 mr-1" />
        SHARE
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-8 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-4 md:mb-6">DISCOVER MUSIC</h1>
          <p className="text-lg md:text-2xl font-bold max-w-4xl">
            EXPLORE AND LICENSE HIGH-QUALITY MUSIC FROM INDEPENDENT ARTISTS
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="SEARCH TRACKS..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
              />
            </div>
            <Button
              variant="outline"
              className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg px-6 py-2 md:py-3 rounded-none"
              onClick={() => setShowFilters(!showFilters)}
            >
              FILTERS
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-6 border-4 border-black bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-lg font-black mb-3 block">GENRE</Label>
                  <Select
                    value={filters.genre}
                    onValueChange={(value) =>
                      setFilters({ ...filters, genre: value })
                    }
                  >
                    <SelectTrigger className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none">
                      <SelectValue placeholder="ALL GENRES" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-4 border-black rounded-none">
                      <SelectItem value="all" className="font-bold">ALL GENRES</SelectItem>
                      <SelectItem value="electronic" className="font-bold">ELECTRONIC</SelectItem>
                      <SelectItem value="hip-hop" className="font-bold">HIP HOP</SelectItem>
                      <SelectItem value="rock" className="font-bold">ROCK</SelectItem>
                      <SelectItem value="pop" className="font-bold">POP</SelectItem>
                      <SelectItem value="jazz" className="font-bold">JAZZ</SelectItem>
                      <SelectItem value="classical" className="font-bold">CLASSICAL</SelectItem>
                      <SelectItem value="ambient" className="font-bold">AMBIENT</SelectItem>
                      <SelectItem value="synthwave" className="font-bold">SYNTHWAVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-lg font-black mb-3 block">MOOD</Label>
                  <Select
                    value={filters.mood}
                    onValueChange={(value) =>
                      setFilters({ ...filters, mood: value })
                    }
                  >
                    <SelectTrigger className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none">
                      <SelectValue placeholder="ALL MOODS" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-4 border-black rounded-none">
                      <SelectItem value="all" className="font-bold">ALL MOODS</SelectItem>
                      <SelectItem value="energetic" className="font-bold">ENERGETIC</SelectItem>
                      <SelectItem value="chill" className="font-bold">CHILL</SelectItem>
                      <SelectItem value="dark" className="font-bold">DARK</SelectItem>
                      <SelectItem value="uplifting" className="font-bold">UPLIFTING</SelectItem>
                      <SelectItem value="melancholic" className="font-bold">MELANCHOLIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border-4 border-black">
                      <div>
                        <p className="font-black">REMIX RIGHTS</p>
                        <p className="text-sm text-gray-600">Show tracks that can be remixed</p>
                      </div>
                      <Switch
                        checked={filters.allowRemixing}
                        onCheckedChange={(checked) =>
                          setFilters({ ...filters, allowRemixing: checked })
                        }
                        className="data-[state=checked]:bg-black"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-4 border-black">
                      <div>
                        <p className="font-black">COMMERCIAL USE</p>
                        <p className="text-sm text-gray-600">Show tracks for commercial use</p>
                      </div>
                      <Switch
                        checked={filters.allowCommercial}
                        onCheckedChange={(checked) =>
                          setFilters({ ...filters, allowCommercial: checked })
                        }
                        className="data-[state=checked]:bg-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg py-3 rounded-none"
                  onClick={() =>
                    setFilters({
                      genre: "",
                      mood: "",
                      allowRemixing: false,
                      allowCommercial: false,
                      search: "",
                    })
                  }
                >
                  CLEAR FILTERS
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Track Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl font-bold">No tracks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className="bg-white border-4 border-black rounded-none overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square">
                  <img
                    src={cidToUrl(track.image_ipfs_cid)}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      className="rounded-full w-16 h-16 md:w-20 md:h-20 bg-white text-black hover:bg-gray-200 border-4 border-black"
                      onClick={() => handlePlayPause(track.id)}
                    >
                      {isPlaying === track.id ? (
                        <Pause className="w-8 h-8 md:w-10 md:h-10" />
                      ) : (
                        <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4 md:p-6">
                  <div className="mb-4">
                    <h3 className="text-lg md:text-xl font-black mb-2 line-clamp-1">
                      {track.title}
                    </h3>
                    <p className="text-base md:text-lg font-bold text-gray-600">
                      {track.account?.name}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-black text-white font-black px-3 py-1 text-sm rounded-none">
                      {track.genre}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-2 border-black text-black font-black px-3 py-1 text-sm rounded-none"
                    >
                      {track.mood?.[0]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-2 border-black text-black font-black px-3 py-1 text-sm rounded-none"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(track.duration)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className={`border-2 border-black text-black hover:bg-black hover:text-white font-black text-sm px-3 py-1 rounded-none ${
                          trackLikes[track.id]?.isLiked ? "bg-black text-white" : ""
                        }`}
                        onClick={() => handleAction(() => handleLike(track.id))}
                      >
                        <Heart
                          className={`w-4 h-4 mr-1 ${
                            trackLikes[track.id]?.isLiked ? "fill-current text-red-500" : ""
                          }`}
                        />
                        {trackLikes[track.id]?.count || 0}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-2 border-black text-black hover:bg-black hover:text-white font-black text-sm px-3 py-1 rounded-none"
                        onClick={() => handleAction(() => handleShare(track))}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Link href={`/track/${track.id}`}>
                      <Button className="bg-black text-white hover:bg-gray-800 font-black text-sm px-4 py-1 rounded-none">
                        LICENSE
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <WalletWarning
        open={showWalletWarning}
        onOpenChange={setShowWalletWarning}
      />
    </div>
  );
} 