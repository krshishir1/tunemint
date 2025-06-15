"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMusicUploadStore } from "@/store/musicStore";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTrackStore } from "@/store/trackStore";
import { formatDistanceToNow } from "date-fns";
import { registerMusicAsIPAsset, mintLicense, claimRevenue } from "@/lib/story";
import { useLicenseStore } from "@/store/licenseStore";
import { useAccountStore } from "@/store/userStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/ui/loading";
import { WalletWarning } from "@/components/auth/wallet-warning";

export default function TrackDetailPage() {
  const params = useParams();
  const musicStore = useMusicUploadStore();
  const trackStore = useTrackStore();
  const licenseStore = useLicenseStore();
  const { account } = useAccountStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showRoyaltyModal, setShowRoyaltyModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("0.01");
  const [royaltyAmount, setRoyaltyAmount] = useState("0.01");
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWalletWarning, setShowWalletWarning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (params.id) {
        setIsLoading(true);
        try {
          await Promise.all([
            musicStore.fetchMusicById(params.id as string),
            trackStore.fetchTipsForMusic(params.id as string),
            trackStore.fetchLikes(params.id as string),
            licenseStore.fetchLicenses(params.id as string),
            licenseStore.fetchRoyaltyPayments(params.id as string)
          ]);
        } catch (error) {
          console.error("Error fetching track data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [params.id]);

  const handleLicense = async () => {
    try {
      if (!params.id || !account?.id) {
        throw new Error("Missing required data");
      }

      await licenseStore.mintLicense(
        params.id as string,
        account.id
      );
      
      // Only close the modal after successful transaction
      setShowLicenseModal(false);
    } catch (error) {
      console.error("Error minting license:", error);
      // Keep modal open on error
    }
  };

  const fetchUnclaimedRevenue = async () => {
    if (!params.id) return;
    
    setIsLoadingRevenue(true);
    try {
      await licenseStore.fetchRoyaltyPayments(params.id as string);
    } catch (error) {
      console.error("Error fetching unclaimed revenue:", error);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  // Calculate total unclaimed royalties
  const calculateUnclaimedRoyalties = () => {
    const royaltyPercentage = trackData.pricing?.royalty || 0;
    return licenseStore.royaltyPayments
      .filter(payment => !payment.is_claimed)
      .reduce((sum, payment) => {
        const claimableAmount = (payment.amount * royaltyPercentage) / 100;
        return sum + claimableAmount;
      }, 0);
  };

  const handleClaimRevenue = async () => {
    try {
      if (!trackData.ip_id) {
        throw new Error("Missing IP ID");
      }

      await claimRevenue(trackData.ip_id as `0x${string}`);
      setShowRevenueModal(false);
    } catch (error) {
      console.error("Error claiming revenue:", error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: musicStore.currentTrack?.title,
        text: `Check out ${musicStore.currentTrack?.title} by ${musicStore.currentTrack?.accounts?.name}`,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleTip = async () => {
    if (params.id) {
      await trackStore.addTip(
        params.id as string, 
        parseFloat(tipAmount),
        trackData.ip_id as `0x${string}`
      );
      setShowTipModal(false);
    }
  };

  const handleLike = async () => {
    if (params.id) {
      await trackStore.toggleLike(params.id as string);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  function cidToUrl(id: string) {
    return `${process.env.NEXT_PUBLIC_PINATA_URL}/${id}`;
  }

  const handlePayRoyalty = async () => {
    try {
      if (!params.id || !selectedLicenseId) {
        throw new Error("Missing required data");
      }

      await licenseStore.payRoyalty(
        params.id as string,
        selectedLicenseId,
        royaltyAmount
      );
      
      // Only close the modal after successful transaction
      setShowRoyaltyModal(false);
      setRoyaltyAmount("0.01"); // Reset amount
      setSelectedLicenseId(null); // Reset selected license
    } catch (error) {
      console.error("Error paying royalty:", error);
      // Keep modal open on error
    }
  };

  const handleOpenRevenueModal = () => {
    setShowRevenueModal(true);
    fetchUnclaimedRevenue();
  };

  const handleAction = (action: () => void) => {
    if (!account) {
      setShowWalletWarning(true);
      return;
    }
    action();
  };

  const renderActionButton = (action: string, onClick: () => void, disabled = false) => (
    <Button
      className="bg-black text-white hover:bg-gray-800 font-black text-xl px-12 py-6 rounded-none"
      onClick={() => handleAction(onClick)}
      disabled={disabled}
    >
      {action}
    </Button>
  );

  if (isLoading) {
    return <LoadingScreen message="Loading track details..." />;
  }

  if (!musicStore.currentTrack) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold">Track not found</p>
          <Link
            href="/discover"
            className="text-black hover:text-gray-600 transition-colors font-black text-xl mt-4 inline-block"
          >
            ← BACK TO DISCOVER
          </Link>
        </div>
      </div>
    );
  }

  const trackData = musicStore.currentTrack;

  return (
    <div className="min-h-screen bg-white text-black">
      <audio
        ref={audioRef}
        src={trackData ? cidToUrl(trackData.audio_ipfs_cid) : ''}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Navigation */}
        <div className="mb-12">
          <Link
            href="/discover"
            className="text-black hover:text-gray-600 transition-colors font-black text-xl"
          >
            ← BACK TO DISCOVER
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-8">
            {/* Track Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="relative w-full md:w-80 flex-shrink-0">
                <img
                  src={cidToUrl(trackData.image_ipfs_cid)}
                  alt={trackData.title}
                  className="w-full h-80 object-cover border-4 border-black"
                />
                <div className="absolute inset-0 h-80 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    className="rounded-full w-24 h-24 bg-white text-black hover:bg-gray-200 border-4 border-black"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="w-10 h-10" />
                    ) : (
                      <Play className="w-10 h-10 ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex-1">
                <div className="mb-8">
                  <h1 className="text-5xl font-black mb-4 leading-tight">
                    {trackData.title}
                  </h1>
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <p className="text-2xl font-black">
                        {trackData.account?.name}
                      </p>
                      <p className="text-lg font-bold text-gray-600">
                        VERIFIED CREATOR
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Badge className="bg-black text-white font-black px-6 py-3 text-lg rounded-none">
                    {trackData.genre}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-4 border-black text-black font-black px-6 py-3 text-lg rounded-none"
                  >
                    {trackData.mood?.[0]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-4 border-black text-black font-black px-6 py-3 text-lg rounded-none"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {formatDuration(trackData.duration)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4">
                  {renderActionButton(
                    `LICENSE FOR ${trackData.pricing?.price} ETH`,
                    () => setShowLicenseModal(true)
                  )}
                  {account && licenseStore.licenses.some(license => license.licensor_account_id === account?.id) && (
                    renderActionButton(
                      "PAY ROYALTY",
                      () => {
                        const userLicense = licenseStore.licenses.find(
                          license => license.licensor_account_id === account?.id
                        );
                        if (userLicense) {
                          setSelectedLicenseId(userLicense.id);
                          setShowRoyaltyModal(true);
                        }
                      }
                    )
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`border-2 border-black text-black hover:bg-black hover:text-white font-black text-sm px-4 py-2 rounded-none ${
                        trackStore.isLiked ? "bg-black text-white" : ""
                      }`}
                      onClick={() => handleAction(handleLike)}
                      disabled={trackStore.isLoading}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${
                          trackStore.isLiked ? "fill-current text-red-500" : ""
                        }`}
                      />
                      {trackStore.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        `LIKE ${trackStore.likes > 0 ? `(${trackStore.likes})` : ""}`
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 border-black text-black hover:bg-black hover:text-white font-black text-sm px-4 py-2 rounded-none"
                      onClick={() => handleAction(handleShare)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      SHARE
                    </Button>
                    {trackData.rights?.allowTips && (
                      <Button
                        variant="outline"
                        className="border-2 border-black text-black hover:bg-black hover:text-white font-black text-sm px-4 py-2 rounded-none"
                        onClick={() => handleAction(() => setShowTipModal(true))}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        TIP
                      </Button>
                    )}
                    {account?.id === trackData.account_id && (
                      renderActionButton(
                        "CLAIM REVENUE",
                        handleOpenRevenueModal
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Waveform */}
            <Card className="bg-white border-4 border-black rounded-none mb-12">
              <CardContent className="p-8">
                <div className="bg-gray-100 border-4 border-black p-8 h-32 flex items-center justify-center">
                  <div className="flex items-end space-x-1 h-20">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 bg-black ${
                          i < 30 ? "animate-pulse" : ""
                        }`}
                        style={{
                          height: `${Math.random() * 60 + 10}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-white border-4 border-black rounded-none mb-12">
              <CardHeader>
                <CardTitle className="text-3xl font-black">
                  ABOUT THIS TRACK
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold mb-8 leading-relaxed">
                  {trackData.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {trackData.mood?.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-2 border-black text-black font-bold px-4 py-2 rounded-none"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tables Section */}
            <Card className="bg-white border-4 border-black rounded-none">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="text-3xl font-black">ACTIVITY</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="licenses" className="w-full">
                  <TabsList className="w-full border-b-4 border-black rounded-none">
                    <TabsTrigger value="licenses" className="flex-1 data-[state=active]:bg-black data-[state=active]:text-white rounded-none">
                      LICENSES
                    </TabsTrigger>
                    <TabsTrigger value="royalties" className="flex-1 data-[state=active]:bg-black data-[state=active]:text-white rounded-none">
                      ROYALTIES
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="flex-1 data-[state=active]:bg-black data-[state=active]:text-white rounded-none">
                      TIPS
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="licenses" className="m-0">
                    {licenseStore.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : licenseStore.error ? (
                      <div className="text-red-500 text-center py-8">{licenseStore.error}</div>
                    ) : licenseStore.licenses.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl font-bold">No licenses minted yet</p>
                        <p className="text-gray-600 mt-2">Be the first to license this track!</p>
                      </div>
                    ) : (
                      <div className="divide-y-4 divide-black">
                        {licenseStore.licenses.map((license) => (
                          <div
                            key={license.id}
                            className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-black text-lg">{license.licensor.name}</p>
                                <p className="text-gray-600 text-sm">
                                  {license.licensor.wallet_address.slice(0, 6)}...{license.licensor.wallet_address.slice(-4)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600">
                                {formatDistanceToNow(new Date(license.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="royalties" className="m-0">
                    {licenseStore.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : licenseStore.error ? (
                      <div className="text-red-500 text-center py-8">{licenseStore.error}</div>
                    ) : licenseStore.royaltyPayments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl font-bold">No royalty payments yet</p>
                        <p className="text-gray-600 mt-2">Royalty payments will appear here</p>
                      </div>
                    ) : (
                      <div className="divide-y-4 divide-black">
                        {licenseStore.royaltyPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                                <Coins className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-black text-lg">{payment.license.licensor.name}</p>
                                <p className="text-gray-600 text-sm">
                                  {payment.license.licensor.wallet_address.slice(0, 6)}...{payment.license.licensor.wallet_address.slice(-4)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-2xl">{payment.amount} ETH</p>
                              <p className="text-gray-600">
                                {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tips" className="m-0">
                    {trackStore.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : trackStore.error ? (
                      <div className="text-red-500 text-center py-8">{trackStore.error}</div>
                    ) : trackStore.tips.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl font-bold">No tips received yet</p>
                        <p className="text-gray-600 mt-2">Be the first to support this artist!</p>
                      </div>
                    ) : (
                      <div className="divide-y-4 divide-black">
                        {trackStore.tips.map((tip) => (
                          <div
                            key={tip.id}
                            className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                                <Coins className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-black text-lg">{tip.user_name}</p>
                                <p className="text-gray-600">
                                  {formatDistanceToNow(new Date(tip.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-2xl">{tip.tip_amount} ETH</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-4 space-y-8">
            {/* License Info */}
            <Card className="bg-white border-4 border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-black">
                  <Shield className="w-6 h-6 mr-3 text-black" />
                  LICENSE DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">PRICE</span>
                  <span className="font-black text-xl">
                    {trackData.pricing?.price} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-lg font-bold">ROYALTY</span>
                  <span className="font-black text-xl">
                    {trackData.pricing?.royalty}%
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">COMMERCIAL USE</span>
                    <Badge
                      className={`font-black px-4 py-2 rounded-none ${
                        trackData.rights?.allowCommercial
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {trackData.rights?.allowCommercial ? "YES" : "NO"}
                    </Badge>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">ATTRIBUTION</span>
                    <Badge className="font-black px-4 py-2 rounded-none bg-yellow-600 text-white">
                      REQUIRED
                    </Badge>
                  </div> */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">MODIFICATIONS</span>
                    <Badge
                      className={`font-black px-4 py-2 rounded-none ${
                        trackData.rights?.allowRemixing
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {trackData.rights?.allowRemixing
                        ? "ALLOWED"
                        : "NOT ALLOWED"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* License Modal */}
        {showLicenseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white border-4 border-black max-w-lg w-full rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-black">
                  <Coins className="w-6 h-6 mr-3 text-black" />
                  LICENSE TRACK
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-100 border-4 border-black p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={cidToUrl(trackData.image_ipfs_cid)}
                      alt={trackData.title}
                      className="w-16 h-16 border-4 border-black"
                    />
                    <div>
                      <p className="font-black text-lg">{trackData.title}</p>
                      <p className="text-lg font-bold text-gray-600">
                        {trackData.accounts?.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">LICENSE PRICE:</span>
                      <span className="font-black text-2xl">
                        {trackData.pricing?.price} ETH
                      </span>
                    </div>
                    {trackData.rights?.allowRemixing && (
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">ROYALTY PERCENTAGE:</span>
                        <span className="font-black text-2xl">
                          {trackData.pricing?.royalty}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-black">LICENSE TERMS</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border-2 border-black">
                      <div>
                        <p className="font-black">COMMERCIAL USE</p>
                        <p className="text-sm text-gray-600">Use in commercial projects</p>
                      </div>
                      <Badge className={`font-black px-4 py-2 rounded-none ${
                        trackData.rights?.allowCommercial
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}>
                        {trackData.rights?.allowCommercial ? "ALLOWED" : "NOT ALLOWED"}
                      </Badge>
                    </div>

                    {trackData.rights?.allowRemixing && (
                      <div className="flex items-center justify-between p-4 border-2 border-black">
                        <div>
                          <p className="font-black">REMIXING RIGHTS</p>
                          <p className="text-sm text-gray-600">Create derivative works</p>
                        </div>
                        <Badge className="font-black px-4 py-2 rounded-none bg-green-600 text-white">
                          ALLOWED
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border-2 border-black">
                      <div>
                        <p className="font-black">ATTRIBUTION</p>
                        <p className="text-sm text-gray-600">Credit the original creator</p>
                      </div>
                      <Badge className="font-black px-4 py-2 rounded-none bg-yellow-600 text-white">
                        REQUIRED
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-4 border-yellow-400 p-4">
                  <p className="text-lg font-bold text-yellow-800">
                    {trackData.rights?.allowRemixing 
                      ? `This license grants you commercial usage rights with ${trackData.pricing?.royalty}% royalty payments to the artist.`
                      : "This license grants you commercial usage rights. Attribution is required."}
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-black text-white hover:bg-gray-800 font-black text-lg py-4 rounded-none"
                    onClick={handleLicense}
                    disabled={licenseStore.isLoading}
                  >
                    {licenseStore.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>MINTING LICENSE...</span>
                      </div>
                    ) : (
                      "CONFIRM LICENSE"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg py-4 rounded-none"
                    onClick={() => setShowLicenseModal(false)}
                    disabled={licenseStore.isLoading}
                  >
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tip Modal */}
        <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
          <DialogContent className="bg-white border-4 border-black rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                SEND TIP
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-gray-100 border-4 border-black p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={cidToUrl(trackData.image_ipfs_cid)}
                    alt={trackData.title}
                    className="w-16 h-16 border-4 border-black"
                  />
                  <div>
                    <p className="font-black text-lg">{trackData.title}</p>
                    <p className="text-lg font-bold text-gray-600">
                      {trackData.accounts?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-lg font-bold mb-3 block">
                  TIP AMOUNT (ETH)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1 bg-black text-white hover:bg-gray-800 font-black text-lg py-4 rounded-none"
                  onClick={handleTip}
                  disabled={trackStore.isLoading}
                >
                  {trackStore.isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "SEND TIP"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg py-4 rounded-none"
                  onClick={() => setShowTipModal(false)}
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revenue Claim Modal */}
        {showRevenueModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white border-4 border-black max-w-lg w-full rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-black">
                  <Coins className="w-6 h-6 mr-3 text-black" />
                  CLAIM REVENUE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-100 border-4 border-black p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={cidToUrl(trackData.image_ipfs_cid)}
                      alt={trackData.title}
                      className="w-16 h-16 border-4 border-black"
                    />
                    <div>
                      <p className="font-black text-lg">{trackData.title}</p>
                      <p className="text-lg font-bold text-gray-600">
                        {trackData.accounts?.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">ROYALTY PERCENTAGE:</span>
                      <span className="font-black text-2xl">
                        {trackData.pricing?.royalty || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">PENDING ROYALTIES:</span>
                      {isLoadingRevenue ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="font-black text-2xl">Loading...</span>
                        </div>
                      ) : (
                        <span className="font-black text-2xl">
                          {calculateUnclaimedRoyalties().toFixed(4)} ETH
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">TOTAL PAYMENTS:</span>
                      {isLoadingRevenue ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="font-black text-2xl">Loading...</span>
                        </div>
                      ) : (
                        <span className="font-black text-2xl">
                          {licenseStore.royaltyPayments.filter(payment => !payment.is_claimed).length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-black text-white hover:bg-gray-800 font-black text-lg py-4 rounded-none"
                    onClick={handleClaimRevenue}
                    disabled={isLoadingRevenue || calculateUnclaimedRoyalties() === 0}
                  >
                    {isLoadingRevenue ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>CLAIMING REVENUE...</span>
                      </div>
                    ) : (
                      "CLAIM REVENUE"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg py-4 rounded-none"
                    onClick={() => {
                      setShowRevenueModal(false);
                    }}
                    disabled={isLoadingRevenue}
                  >
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Royalty Payment Modal */}
        {showRoyaltyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white border-4 border-black max-w-lg w-full rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-black">
                  <Coins className="w-6 h-6 mr-3 text-black" />
                  PAY ROYALTY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-100 border-4 border-black p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={cidToUrl(trackData.image_ipfs_cid)}
                      alt={trackData.title}
                      className="w-16 h-16 border-4 border-black"
                    />
                    <div>
                      <p className="font-black text-lg">{trackData.title}</p>
                      <p className="text-lg font-bold text-gray-600">
                        {trackData.accounts?.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">ROYALTY PERCENTAGE:</span>
                      <span className="font-black text-2xl">
                        {trackData.pricing?.royalty}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-lg font-bold mb-3 block">
                    ROYALTY AMOUNT (ETH)
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    value={royaltyAmount}
                    onChange={(e) => setRoyaltyAmount(e.target.value)}
                    className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-black text-white hover:bg-gray-800 font-black text-lg py-4 rounded-none"
                    onClick={handlePayRoyalty}
                    disabled={licenseStore.isLoading}
                  >
                    {licenseStore.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>PAYING ROYALTY...</span>
                      </div>
                    ) : (
                      "PAY ROYALTY"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg py-4 rounded-none"
                    onClick={() => {
                      setShowRoyaltyModal(false);
                      setRoyaltyAmount("0.01");
                      setSelectedLicenseId(null);
                    }}
                    disabled={licenseStore.isLoading}
                  >
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
