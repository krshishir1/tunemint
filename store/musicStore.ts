// stores/musicUploadStore.ts
import { create } from "zustand";
import { uploadMusicGroupToPinata } from "@/lib/pinata";
import createClient from "@/lib/supabase/client";

const supabase = createClient();

type Creator = {
  name: string;
  address: string;
  contributionPercent: number;
};

type MusicUploadState = {
  step: number;
  audioFile: File | null;
  coverFile: File | null;
  metadata: {
    title: string;
    description?: string;
    creators: Creator[];
    genre?: string;
    mood?: string[];
    duration?: number;
    license?: string;
    external_url?: string;
    media_type?: string;
    rights?: {
      allowTips: boolean;
      allowCommercial: boolean;
      allowRemixing: boolean;
    };
    pricing?: {
      price: string;
      royalty: string;
    };
  };
  nftMetadata: any;
  ipfsCids: {
    audio?: string;
    cover?: string;
    metadata?: string;
  };
  transactionDetails: {
    ipId?: string;
    txHash?: string;
    status?: "pending" | "success" | "failed";
    licenseTermsIds?: bigint[];
  };
  currentTrack: any;
  isLoading: boolean;
  setStep: (step: number) => void;
  setAudioFile: (file: File) => void;
  setCoverFile: (file: File) => void;
  setMetadata: (metadata: Partial<MusicUploadState["metadata"]>) => void;
  setNftMetadata: (nftMetadata: any) => void;
  setTransactionDetails: (
    details: Partial<MusicUploadState["transactionDetails"]>
  ) => void;
  uploadToPinata: () => Promise<void>;
  registerMusic: (accountId: string) => Promise<string>;
  fetchMusicById: (id: string) => Promise<void>;
};

export const useMusicUploadStore = create<MusicUploadState>((set, get) => ({
  step: 1,
  audioFile: null,
  coverFile: null,
  metadata: {
    title: "",
    creators: [],
  },
  nftMetadata: {},
  ipfsCids: {},
  transactionDetails: {},
  currentTrack: null,
  isLoading: false,
  setStep: (step) => set({ step }),
  setAudioFile: (file) => set({ audioFile: file }),
  setCoverFile: (file) => set({ coverFile: file }),
  setMetadata: (metadata) =>
    set((state) => ({ metadata: { ...state.metadata, ...metadata } })),
  setNftMetadata: (nftMetadata) => set({ nftMetadata }),
  setTransactionDetails: (details) =>
    set((state) => ({
      transactionDetails: { ...state.transactionDetails, ...details },
    })),
  uploadToPinata: async () => {
    const { audioFile, coverFile, metadata } = get();
    if (!audioFile || !coverFile) throw new Error("Files missing");
    const result = await uploadMusicGroupToPinata({
      audioFile,
      coverFile,
      metadata,
    });
    console.log("Result upload", result);
    set({
      ipfsCids: {
        audio: result.audioCid,
        cover: result.coverCid,
        metadata: result.metadataCid,
      },
    });
  },
  registerMusic: async (accountId) => {
    const { metadata, ipfsCids, transactionDetails } = get();

    // Validate required fields
    if (!accountId) {
      throw new Error("Account ID is required");
    }

    if (!metadata.title) {
      throw new Error("Title is required");
    }

    if (!ipfsCids.cover || !ipfsCids.audio || !ipfsCids.metadata) {
      throw new Error("All IPFS CIDs are required");
    }

    if (!transactionDetails.ipId || !transactionDetails.txHash) {
      throw new Error("Transaction details are required");
    }

    console.log("Transaction details: ", transactionDetails);

    // Prepare the insert data
    const insertData = {
      account_id: accountId,
      title: metadata.title,
      description: metadata.description || null,
      creators: metadata.creators || [],
      image_ipfs_cid: ipfsCids.cover,
      audio_ipfs_cid: ipfsCids.audio,
      metadata_ipfs_cid: ipfsCids.metadata,
      media_type: metadata.media_type || "audio",
      genre: metadata.genre || null,
      mood: metadata.mood || [],
      duration: Math.floor(metadata?.duration as number) || null,
      license: metadata.license || "non-commercial",
      external_url: metadata.external_url || null,
      ip_id: transactionDetails.ipId,
      transaction_hash: transactionDetails.txHash,
      license_id: transactionDetails.licenseTermsIds[0].toString(),
      status: transactionDetails.status || "pending",
      rights: {
        allowTips: metadata.rights?.allowTips ?? true,
        allowCommercial: metadata.rights?.allowCommercial ?? true,
        allowRemixing: metadata.rights?.allowRemixing ?? false,
      },
      pricing: {
        price: metadata.pricing?.price ?? "0.1",
        royalty: metadata.pricing?.royalty ?? "10",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Log the data we're trying to insert
    console.log("Inserting music data:", insertData);

    try {
      const { data, error } = await supabase
        .from("music_uploads")
        .insert([insertData])
        .select("id")
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error("Error in registerMusic:", error);
      throw error;
    }
  },
  fetchMusicById: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("music_uploads")
        .select(
          `
          *,
          account:account_id (
            name,
            wallet_address
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      set({ currentTrack: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching music:", error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
