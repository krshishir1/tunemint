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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-7xl font-black mb-4">DISCOVER MUSIC</h1>
          <p className="text-2xl font-bold">
            EXPLORE AND LICENSE TRACKS FROM INDEPENDENT ARTISTS
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="SEARCH TRACKS..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none flex-1"
            />
            <Button
              variant="outline"
              className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg px-8 py-4 rounded-none"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-6 h-6 mr-2" />
              FILTERS
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="bg-white border-4 border-black rounded-none mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-lg font-bold mb-3 block">GENRE</label>
                    <Select
                      value={filters.genre}
                      onValueChange={(value) =>
                        setFilters({ ...filters, genre: value })
                      }
                    >
                      <SelectTrigger className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none">
                        <SelectValue placeholder="SELECT GENRE" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-4 border-black rounded-none">
                        <SelectItem value="all">ALL GENRES</SelectItem>
                        <SelectItem value="electronic">ELECTRONIC</SelectItem>
                        <SelectItem value="hip-hop">HIP HOP</SelectItem>
                        <SelectItem value="rock">ROCK</SelectItem>
                        <SelectItem value="pop">POP</SelectItem>
                        <SelectItem value="jazz">JAZZ</SelectItem>
                        <SelectItem value="classical">CLASSICAL</SelectItem>
                        <SelectItem value="ambient">AMBIENT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-lg font-bold mb-3 block">MOOD</label>
                    <Select
                      value={filters.mood}
                      onValueChange={(value) =>
                        setFilters({ ...filters, mood: value })
                      }
                    >
                      <SelectTrigger className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none">
                        <SelectValue placeholder="SELECT MOOD" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-4 border-black rounded-none">
                        <SelectItem value="all">ALL MOODS</SelectItem>
                        <SelectItem value="energetic">ENERGETIC</SelectItem>
                        <SelectItem value="chill">CHILL</SelectItem>
                        <SelectItem value="happy">HAPPY</SelectItem>
                        <SelectItem value="sad">SAD</SelectItem>
                        <SelectItem value="dark">DARK</SelectItem>
                        <SelectItem value="uplifting">UPLIFTING</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border-4 border-black">
                    <div>
                      <h4 className="text-lg font-black mb-2">REMIX RIGHTS</h4>
                      <p className="text-sm font-bold text-gray-600">
                        ALLOW REMIXING
                      </p>
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
                      <h4 className="text-lg font-black mb-2">COMMERCIAL USE</h4>
                      <p className="text-sm font-bold text-gray-600">
                        ALLOW COMMERCIAL
                      </p>
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

                <div className="flex justify-end mt-6">
                  <Button
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg px-8 py-4 rounded-none"
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
                    <X className="w-6 h-6 mr-2" />
                    CLEAR FILTERS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tracks Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTracks?.map((track) => (
            <Link
              key={track.id}
              href={`/track/${track.id}`}
              className="group"
            >
              <Card className="bg-white border-2 border-black rounded-none overflow-hidden hover:border-gray-400 transition-colors">
                <div className="relative aspect-square">
                  <img
                    src={cidToUrl(track.image_ipfs_cid)}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      className="rounded-full w-16 h-16 bg-white text-black hover:bg-gray-200 border-2 border-black"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePlayPause(track.id);
                      }}
                    >
                      {isPlaying === track.id ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="text-lg font-black mb-1 line-clamp-1">
                    {track.title}
                  </h3>
                  <p className="text-sm font-bold text-gray-600 mb-2 line-clamp-1">
                    {track.account?.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge className="bg-black text-white font-black px-2 py-1 text-xs rounded-none">
                      {track.genre}
                    </Badge>
                    {track.mood?.slice(0, 1).map((mood: string) => (
                      <Badge
                        key={mood}
                        variant="outline"
                        className="border border-black text-black font-bold px-2 py-1 text-xs rounded-none"
                      >
                        {mood}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-bold">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                    {renderActionButtons(track)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Loading State */}
        {!filteredTracks && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        )}

        {/* No Results */}
        {filteredTracks?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl font-black mb-4">NO TRACKS FOUND</p>
            <p className="text-lg font-bold text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>

      {/* Add Wallet Warning Modal */}
      <WalletWarning 
        open={showWalletWarning} 
        onOpenChange={setShowWalletWarning} 
      />
    </div>
  );
} 