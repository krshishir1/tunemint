"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  Music,
  Check,
  Loader2,
  Image,
  Shield,
  Coins,
} from "lucide-react";
import { useAccountStore } from "@/store/userStore";
import { useMusicUploadStore } from "@/store/musicStore";
import { registerMusicAsIPAsset } from "@/lib/story";
import { withWallet } from "@/components/auth/with-wallet";
import { LoadingScreen } from "@/components/ui/loading";

function UploadPage() {
  const router = useRouter();
  const { account } = useAccountStore();
  const musicStore = useMusicUploadStore();
  const [uploadStep, setUploadStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(
    null
  );
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [fileError, setFileError] = useState<string>("");
  const [musicId, setMusicId] = useState<string>("");

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    artist: account?.name ?? "",
    description: "",
    genre: "",
    mood: "",
    allowTips: true,
    allowCommercial: true,
    allowRemixing: false,
    price: "0.1",
    royalty: "10",
  });

  // Update artist name when account changes
  useEffect(() => {
    if (account?.name) {
      setFormData(prev => ({
        ...prev,
        artist: account.name ?? ""
      }));
    }
  }, [account]);

  // If no account, show loading state
  if (!account) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAudioFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    setFileError(""); // Reset error state

    if (file) {
      // Validate file type
      const validTypes = [".mp3", ".wav"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        setFileError("Please select a valid audio file (.mp3 or .wav)");
        return;
      }

      // Get audio duration
      try {
        const duration = await getAudioDuration(file);
        console.log("Duration: ", duration);
        setAudioDuration(duration);
        setSelectedAudioFile(file);
        setUploadStep(2);
      } catch (error) {
        setFileError("Error processing audio file. Please try another file.");
        console.error("Error getting audio duration:", error);
      }
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener("error", (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      });

      audio.src = objectUrl;
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCoverImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedCoverImage(file);
      const imageUrl = URL.createObjectURL(file);
      setCoverImagePreview(imageUrl);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (uploadStep < 3) {
      setUploadStep(uploadStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (uploadStep > 1) {
      setUploadStep(uploadStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Set files in the store
      if (selectedAudioFile) {
        musicStore.setAudioFile(selectedAudioFile);
      }
      if (selectedCoverImage) {
        musicStore.setCoverFile(selectedCoverImage);
      }

      // Set metadata in the store
      musicStore.setMetadata({
        title: formData.title,
        description: formData.description,
        creators: [{
          name: formData.artist,
          address: account?.wallet_address ?? "",
          contributionPercent: 100
        }],
        genre: formData.genre,
        mood: [formData.mood],
        duration: audioDuration,
        license: formData.allowCommercial ? "commercial" : "non-commercial",
        media_type: "audio",
        rights: {
          allowTips: formData.allowTips,
          allowCommercial: formData.allowCommercial,
          allowRemixing: formData.allowRemixing
        },
        pricing: {
          price: formData.price,
          royalty: formData.royalty
        }
      });

      // Upload to Pinata
      await musicStore.uploadToPinata();
      const ipAssetMetadata = {
        title: formData.title,
        description: formData.description,
        creators: [{
          name: formData.artist,
          address: account?.wallet_address ?? "",
          contributionPercent: 100
        }],
        genre: formData.genre,
        mood: [formData.mood],
        duration: audioDuration,
        license: formData.allowCommercial ? "commercial" : "non-commercial",
        media_type: "audio",
        rights: {
          allowTips: formData.allowTips,
          allowCommercial: formData.allowCommercial,
          allowRemixing: formData.allowRemixing
        },
        pricing: {
          price: formData.price,
          royalty: formData.royalty
        }
      }

      // Register IP asset and get transaction details
      const response = await registerMusicAsIPAsset(ipAssetMetadata);
      
      // Store transaction details
      musicStore.setTransactionDetails({
        ipId: response.ipId,
        txHash: response.txHash,
        status: 'success',
        licenseTermsIds: response.licenseTermsIds,
      });

      console.log("Account: ", account?.id)
      // Register in Supabase and get music ID
      const musicId = await musicStore.registerMusic(account?.id ?? "");
      
      // Store music ID in state for routing
      setMusicId(musicId);
      setUploadStep(4); // Success step
    } catch (error) {
      console.error("Error submitting asset:", error);
      setFileError("Error uploading files. Please try again.");
      musicStore.setTransactionDetails({
        status: 'failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStepTitle = () => {
    switch (uploadStep) {
      case 1:
        return "UPLOAD AUDIO FILE";
      case 2:
        return "COVER IMAGE & METADATA";
      case 3:
        return "LICENSING & NFT SETTINGS";
      case 4:
        return "";
      default:
        return "UPLOAD YOUR MUSIC";
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16">
          <h1 className="text-7xl font-black mb-4">UPLOAD YOUR MUSIC</h1>
          <p className="text-2xl font-bold">
            REGISTER YOUR MUSIC AS IP AND START EARNING FROM LICENSES
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-20">
          <div className="flex items-center space-x-8">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-16 h-16 border-4 border-black ${
                    uploadStep >= step
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  } font-black text-xl`}
                >
                  {uploadStep > step ? <Check className="w-8 h-8" /> : step}
                </div>
                {index < 2 && (
                  <div
                    className={`w-24 h-2 ${
                      uploadStep > step ? "bg-black" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-white border-4 border-black rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center text-3xl font-black">
              {uploadStep === 1 && (
                <Upload className="w-8 h-8 mr-4 text-black" />
              )}
              {uploadStep === 2 && (
                <Image className="w-8 h-8 mr-4 text-black" />
              )}
              {uploadStep === 3 && (
                <Shield className="w-8 h-8 mr-4 text-black" />
              )}
              {getStepTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Audio Upload */}
            {uploadStep === 1 && (
              <div className="border-4 border-dashed border-black p-20 text-center hover:bg-gray-50 transition-colors">
                <Music className="w-24 h-24 text-black mx-auto mb-8" />
                <h3 className="text-2xl font-black mb-4">
                  DROP YOUR AUDIO FILE HERE
                </h3>
                <p className="text-xl font-bold mb-12">
                  SUPPORTS MP3, WAV FILES UP TO 50MB
                </p>
                {fileError && (
                  <div className="bg-red-100 border-4 border-red-500 p-6 mb-8">
                    <p className="text-lg font-bold text-red-700">
                      {fileError}
                    </p>
                  </div>
                )}
                {selectedAudioFile && (
                  <div className="bg-gray-100 border-4 border-black p-6 mb-8">
                    <p className="text-lg font-bold">SELECTED FILE:</p>
                    <p className="font-black text-xl mb-2">
                      {selectedAudioFile.name}
                    </p>
                    <p className="text-lg font-bold">
                      Duration: {formatDuration(audioDuration)}
                    </p>
                    <p className="text-lg font-bold">
                      Size:{" "}
                      {(selectedAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    id="audio-file-upload"
                    className="hidden"
                    onChange={handleAudioFileSelect}
                    accept=".mp3,.wav"
                  />
                  <label
                    htmlFor="audio-file-upload"
                    className="bg-black text-white hover:bg-gray-800 font-black text-xl px-12 py-3 cursor-pointer rounded-none"
                  >
                    CHOOSE AUDIO FILE
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Cover Image & Metadata */}
            {uploadStep === 2 && (
              <div className="space-y-12">
                {/* Cover Image Upload */}
                <div>
                  <h3 className="text-2xl font-black mb-6">COVER IMAGE</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="border-4 border-dashed border-black p-12 text-center hover:bg-gray-50 transition-colors">
                      {coverImagePreview ? (
                        <div className="space-y-6">
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="w-full h-48 object-cover border-4 border-black"
                          />
                          <p className="text-lg font-bold mb-2">
                            COVER IMAGE SELECTED
                          </p>
                        </div>
                      ) : (
                        <>
                          <Image className="w-16 h-16 text-black mx-auto mb-6" />
                          <h4 className="text-xl font-black mb-4">
                            UPLOAD COVER IMAGE
                          </h4>
                          <p className="text-lg font-bold mb-8">
                            JPG, PNG UP TO 10MB
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleCoverImageSelect}
                        className="hidden"
                        id="cover-image-upload"
                      />
                      <label htmlFor="cover-image-upload" className="bg-black text-white hover:bg-gray-800 font-black text-lg px-8 py-2 rounded-none">
                        {coverImagePreview ? "CHANGE IMAGE" : "CHOOSE IMAGE"}
                      </label>
                    </div>

                    {/* Audio File Info */}
                    <div className="bg-gray-100 border-4 border-black p-8">
                      <h4 className="text-xl font-black mb-4">AUDIO FILE</h4>
                      <p className="text-lg font-bold mb-2">FILENAME:</p>
                      <p className="font-black text-lg mb-4">
                        {selectedAudioFile?.name}
                      </p>
                      <p className="text-lg font-bold mb-2">DURATION:</p>
                      <p className="font-black text-lg">
                        {formatDuration(audioDuration)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata Form */}
                <div>
                  <h3 className="text-2xl font-black mb-6">TRACK METADATA</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <Label
                        htmlFor="title"
                        className="text-xl font-black mb-3 block"
                      >
                        TRACK TITLE
                      </Label>
                      <Input
                        id="title"
                        placeholder="ENTER TRACK TITLE"
                        value={formData.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                        required
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="artist"
                        className="text-xl font-black mb-3 block"
                      >
                        ARTIST NAME
                      </Label>
                      <Input
                        id="artist"
                        placeholder="ENTER ARTIST NAME"
                        value={formData.artist}
                        onChange={(e) =>
                          handleInputChange("artist", e.target.value)
                        }
                        className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                        required
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="genre"
                        className="text-xl font-black mb-3 block"
                      >
                        GENRE
                      </Label>
                      <Select
                        value={formData.genre}
                        onValueChange={(value) =>
                          handleInputChange("genre", value)
                        }
                      >
                        <SelectTrigger className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none">
                          <SelectValue placeholder="SELECT GENRE" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-4 border-black rounded-none">
                          <SelectItem value="electronic" className="font-bold">
                            ELECTRONIC
                          </SelectItem>
                          <SelectItem value="hip-hop" className="font-bold">
                            HIP HOP
                          </SelectItem>
                          <SelectItem value="rock" className="font-bold">
                            ROCK
                          </SelectItem>
                          <SelectItem value="pop" className="font-bold">
                            POP
                          </SelectItem>
                          <SelectItem value="jazz" className="font-bold">
                            JAZZ
                          </SelectItem>
                          <SelectItem value="classical" className="font-bold">
                            CLASSICAL
                          </SelectItem>
                          <SelectItem value="ambient" className="font-bold">
                            AMBIENT
                          </SelectItem>
                          <SelectItem value="synthwave" className="font-bold">
                            SYNTHWAVE
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="mood"
                        className="text-xl font-black mb-3 block"
                      >
                        MOOD
                      </Label>
                      <Select
                        value={formData.mood}
                        onValueChange={(value) =>
                          handleInputChange("mood", value)
                        }
                      >
                        <SelectTrigger className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none">
                          <SelectValue placeholder="SELECT MOOD" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-4 border-black rounded-none">
                          <SelectItem value="energetic" className="font-bold">
                            ENERGETIC
                          </SelectItem>
                          <SelectItem value="chill" className="font-bold">
                            CHILL
                          </SelectItem>
                          <SelectItem value="dark" className="font-bold">
                            DARK
                          </SelectItem>
                          <SelectItem value="uplifting" className="font-bold">
                            UPLIFTING
                          </SelectItem>
                          <SelectItem value="melancholic" className="font-bold">
                            MELANCHOLIC
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Label
                      htmlFor="description"
                      className="text-xl font-black mb-3 block"
                    >
                      DESCRIPTION
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="DESCRIBE YOUR TRACK, ITS INSPIRATION, AND IDEAL USE CASES..."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      className="bg-white border-4 border-black text-black font-bold text-lg rounded-none"
                      rows={6}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-xl px-8 py-4 rounded-none"
                  >
                    BACK
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="bg-black text-white hover:bg-gray-800 font-black text-xl px-12 py-4 rounded-none"
                    disabled={
                      !formData.title ||
                      !formData.artist ||
                      !formData.genre ||
                      !formData.mood
                    }
                  >
                    CONTINUE TO LICENSING
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Licensing & NFT Settings */}
            {uploadStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Rights & Permissions */}
                <div>
                  <h3 className="text-2xl font-black mb-6">
                    RIGHTS & PERMISSIONS
                  </h3>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 border-4 border-black">
                      <div>
                        <h4 className="text-xl font-black mb-2">
                          ALLOW RECEIVING TIPS
                        </h4>
                        <p className="text-lg font-bold text-gray-600">
                          ENABLE FANS TO SEND YOU TIPS FOR YOUR MUSIC
                        </p>
                      </div>
                      <Switch
                        checked={formData.allowTips}
                        onCheckedChange={(checked) =>
                          handleInputChange("allowTips", checked)
                        }
                        className="data-[state=checked]:bg-black"
                      />
                    </div>

                    <div className="flex items-center justify-between p-6 border-4 border-black">
                      <div>
                        <h4 className="text-xl font-black mb-2">
                          COMMERCIAL USE RIGHTS
                        </h4>
                        <p className="text-lg font-bold text-gray-600">
                          ALLOW COMMERCIAL USE OF YOUR TRACK
                        </p>
                      </div>
                      <Switch
                        checked={formData.allowCommercial}
                        onCheckedChange={(checked) =>
                          handleInputChange("allowCommercial", checked)
                        }
                        className="data-[state=checked]:bg-black"
                      />
                    </div>

                    <div className="flex items-center justify-between p-6 border-4 border-black">
                      <div>
                        <h4 className="text-xl font-black mb-2">
                          REMIXING RIGHTS
                        </h4>
                        <p className="text-lg font-bold text-gray-600">
                          ALLOW OTHERS TO REMIX AND MODIFY YOUR TRACK
                        </p>
                      </div>
                      <Switch
                        checked={formData.allowRemixing}
                        onCheckedChange={(checked) =>
                          handleInputChange("allowRemixing", checked)
                        }
                        className="data-[state=checked]:bg-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-4 border-black p-8">
                  <h3 className="text-2xl font-black mb-6">LICENSING TERMS</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="price"
                        className="text-xl font-black mb-3 block"
                      >
                        LICENSE PRICE (ETH)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.001"
                        placeholder="0.1"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange("price", e.target.value)
                        }
                        className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="royalty"
                        className="text-xl font-black mb-3 block"
                      >
                        ROYALTY PERCENTAGE
                      </Label>
                      <Input
                        id="royalty"
                        type="number"
                        placeholder="10"
                        value={formData.royalty}
                        onChange={(e) =>
                          handleInputChange("royalty", e.target.value)
                        }
                        className="bg-white border-4 border-black text-black font-bold text-lg h-14 rounded-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-100 border-4 border-black p-8">
                  <h3 className="text-2xl font-black mb-6">SUMMARY</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-lg font-bold mb-2">TRACK:</p>
                      <p className="font-black text-xl mb-4">
                        {formData.title || "UNTITLED"}
                      </p>
                      <p className="text-lg font-bold mb-2">ARTIST:</p>
                      <p className="font-black text-xl mb-4">
                        {formData.artist || "UNKNOWN"}
                      </p>
                      <p className="text-lg font-bold mb-2">GENRE:</p>
                      <p className="font-black text-xl">
                        {formData.genre?.toUpperCase() || "NOT SELECTED"}
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold mb-2">LICENSE PRICE:</p>
                      <p className="font-black text-xl mb-4">
                        {formData.price} ETH
                      </p>
                      <p className="text-lg font-bold mb-2">ROYALTY:</p>
                      <p className="font-black text-xl mb-4">
                        {formData.royalty}%
                      </p>
                      <p className="text-lg font-bold mb-2">RIGHTS:</p>
                      <div className="space-y-1">
                        <p className="font-bold">
                          {formData.allowTips ? "✓" : "✗"} TIPS ENABLED
                        </p>
                        <p className="font-bold">
                          {formData.allowCommercial ? "✓" : "✗"} COMMERCIAL USE
                        </p>
                        <p className="font-bold">
                          {formData.allowRemixing ? "✓" : "✗"} REMIXING ALLOWED
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-xl px-8 py-4 rounded-none"
                  >
                    BACK
                  </Button>
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-gray-800 font-black text-xl px-12 py-8 rounded-none"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-4 animate-spin" />
                        REGISTERING AS IP...
                      </>
                    ) : (
                      <>
                        <Coins className="w-6 h-6 mr-4" />
                        REGISTER AS IP
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Success */}
            {uploadStep === 4 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-12">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-8">
                  IP REGISTERED SUCCESSFULLY!
                </h2>
                <p className="text-xl font-bold mb-16 leading-relaxed max-w-3xl mx-auto">
                  YOUR TRACK HAS BEEN UPLOADED AND REGISTERED AS INTELLECTUAL
                  PROPERTY ON-CHAIN. IT'S NOW AVAILABLE FOR LICENSING ON THE
                  PLATFORM WITH YOUR SPECIFIED TERMS.
                </p>

                <div className="bg-gray-100 border-4 border-black p-8 mb-12 max-w-2xl mx-auto">
                  <div className="grid grid-cols-2 gap-8 text-left">
                    <div>
                      <p className="text-lg font-bold mb-2">TRACK TITLE:</p>
                      <p className="font-black text-lg mb-4">
                        {formData.title}
                      </p>
                      <p className="text-lg font-bold mb-2">LICENSE PRICE:</p>
                      <p className="font-black text-lg">{formData.price} ETH</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold mb-2">IP ID:</p>
                      <p className="font-mono text-sm font-bold mb-4">
                        {musicStore.transactionDetails.ipId}
                      </p>
                      <p className="text-lg font-bold mb-2">
                        TRANSACTION HASH:
                      </p>
                      <p className="font-mono text-sm font-bold">
                        {musicStore.transactionDetails.txHash}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 justify-center">
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 font-black text-xl px-12 py-6 rounded-none"
                    onClick={() => router.push(`/track/${musicId}`)}
                  >
                    VIEW ON PLATFORM
                  </Button>
                  <Button
                    variant="outline"
                    className="border-4 border-black text-black hover:bg-black hover:text-white font-black text-xl px-12 py-6 rounded-none"
                    onClick={() => {
                      setUploadStep(1);
                      setSelectedAudioFile(null);
                      setSelectedCoverImage(null);
                      setCoverImagePreview("");
                      setMusicId("");
                      setFormData({
                        title: "",
                        artist: account?.name ?? "",
                        description: "",
                        genre: "",
                        mood: "",
                        allowTips: true,
                        allowCommercial: true,
                        allowRemixing: false,
                        price: "0.1",
                        royalty: "10",
                      });
                    }}
                  >
                    UPLOAD ANOTHER TRACK
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withWallet(UploadPage, true);
