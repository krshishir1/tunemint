"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Edit,
  Save,
  X,
  Music,
  Heart,
  Download,
  TrendingUp,
  Loader2,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { useAccountStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { useTrackStore } from "@/store/trackStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { withWallet } from "@/components/auth/with-wallet";
import { LoadingScreen } from "@/components/ui/loading";

function ProfilePage() {
  const router = useRouter();
  const { account, registerAccount, updateAccount, uploadProfilePhoto } =
    useAccountStore();
  const trackStore = useTrackStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    name: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const initializeAccount = async () => {
      try {
        await registerAccount();
        if (account?.id) {
          await trackStore.fetchTipsOfUser(account.id);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing account:", error);
        setIsLoading(false);
      }
    };

    if (!account) {
      initializeAccount();
    } else {
      setEditData({
        username: account.username,
        name: account.name || "",
        bio: account.bio || "",
      });
      trackStore.fetchTipsOfUser(account.id);
      setIsLoading(false);
    }
  }, [account, registerAccount]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File changed: ", file)  
      setSelectedFile(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (selectedFile && account) {
      try {
        const avatarUrl = await uploadProfilePhoto(selectedFile);
        await updateAccount({ avatar_url: avatarUrl });
        setSelectedFile(null);
      } catch (error) {
        console.error("Error uploading profile photo:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!account) return;

    try {
      await updateAccount({
        username: editData.username,
        name: editData.name,
        bio: editData.bio,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setEditData({
      username: account?.username || "",
      name: account?.name || "",
      bio: account?.bio || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-2xl font-bold">
          Please connect your wallet to view profile
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Profile Image */}
            <div>

            <div className="relative">
              <img
                src={account.avatar_url || "/default-avatar.png"}
                alt={account.name || account.username}
                className="w-64 h-64 object-cover border-4 border-black"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <label
                  htmlFor="profile-image-upload"
                  className="cursor-pointer bg-white text-black hover:bg-gray-200 font-bold px-4 py-2 rounded-none border-4 border-black"
                >
                  <Camera className="w-6 h-6 inline-block mr-2" />
                  Choose Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  id="profile-image-upload"
                  className="hidden"
                />
              </div>
            </div>

            {/* File Preview and Upload Button */}
            {selectedFile && (
              <div className="mt-1 p-4 border-0 border-black bg-white">
                <div className="flex flex-col items-center justify-between">
                  <div className="flex gap-3">
                    <p className="font-bold text-lg mb-1">Selected file:</p>
                    <p className="text-gray-600">{selectedFile.name}</p>
                  </div>
                  <Button
                    onClick={handleUploadPhoto}
                    className="bg-black text-white hover:bg-gray-800 font-bold px-6 py-2 rounded-none"
                  >
                    Update Photo
                  </Button>
                </div>
              </div>
            )}

            </div>
            

            {/* Profile Info */}
            <div className="flex-1">
              {!isEditing ? (
                <div>
                  <div className="flex items-center gap-6 mb-8">
                    <h1 className="text-6xl font-black">
                      {account.name || account.username}
                    </h1>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-black text-white hover:bg-gray-800 font-black text-lg px-8 py-4 rounded-none"
                    >
                      <Edit className="w-5 h-5 mr-3" />
                      EDIT PROFILE
                    </Button>
                  </div>
                  <p className="text-2xl font-bold text-gray-600 mb-6">
                    @{account.username}
                  </p>
                  <p className="text-xl font-bold mb-8 leading-relaxed max-w-3xl">
                    {account.bio || "No bio yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <Label
                      htmlFor="name"
                      className="text-xl font-black mb-3 block"
                    >
                      DISPLAY NAME
                    </Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="username"
                      className="text-xl font-black mb-3 block"
                    >
                      USERNAME
                    </Label>
                    <Input
                      id="username"
                      value={editData.username}
                      onChange={(e) =>
                        setEditData({ ...editData, username: e.target.value })
                      }
                      className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="bio"
                      className="text-xl font-black mb-3 block"
                    >
                      BIO
                    </Label>
                    <Textarea
                      id="bio"
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                      className="bg-white border-4 border-black text-black font-bold text-lg rounded-none"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSave}
                      className="bg-black text-white hover:bg-gray-800 font-black text-lg px-8 py-4 rounded-none"
                    >
                      <Save className="w-5 h-5 mr-3" />
                      SAVE CHANGES
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-lg px-8 py-4 rounded-none"
                    >
                      <X className="w-5 h-5 mr-3" />
                      CANCEL
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        <Card className="bg-white border-4 border-black rounded-none mb-16">
          <CardHeader>
            <CardTitle className="text-3xl font-black">
              WALLET INFORMATION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Label className="text-xl font-black mb-3 block">
                  WALLET ADDRESS
                </Label>
                <div className="bg-gray-100 border-4 border-black p-4 font-mono text-lg font-bold">
                  {account.wallet_address}
                </div>
              </div>
              <div>
                <Label className="text-xl font-black mb-3 block">
                  MEMBER SINCE
                </Label>
                <div className="bg-gray-100 border-4 border-black p-4 text-lg font-bold">
                  {new Date(account.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-black text-white border-4 border-black rounded-none">
          <CardHeader>
            <CardTitle className="text-3xl font-black">QUICK ACTIONS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/upload">
                <Button className="w-full bg-white text-black hover:bg-gray-200 font-black text-xl py-8 rounded-none">
                  <Music className="w-6 h-6 mr-3" />
                  UPLOAD TRACK
                </Button>
              </Link>
              <Link href="/discover">
                <Button className="w-full bg-white text-black hover:bg-gray-200 font-black text-xl py-8 rounded-none">
                  <Heart className="w-6 h-6 mr-3" />
                  DISCOVER MUSIC
                </Button>
              </Link>
              <Button className="w-full bg-white text-black hover:bg-gray-200 font-black text-xl py-8 rounded-none">
                <Download className="w-6 h-6 mr-3" />
                DOWNLOAD REPORTS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips History */}
        <Card className="bg-white border-4 border-black rounded-none mt-16">
          <CardHeader className="border-b-4 border-black">
            <CardTitle className="flex items-center text-3xl font-black">
              <Coins className="w-8 h-8 mr-3" />
              TIPS HISTORY
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {trackStore.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : trackStore.error ? (
              <div className="text-red-500 text-center py-8">{trackStore.error}</div>
            ) : trackStore.tips.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-bold">No tips given yet</p>
                <p className="text-gray-600 mt-2">Start supporting artists by sending tips!</p>
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
                        <Link
                          href={`/track/${tip.music_id}`}
                          className="font-black text-lg hover:underline"
                        >
                          Track #{tip.music_id}
                        </Link>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withWallet(ProfilePage, true);
