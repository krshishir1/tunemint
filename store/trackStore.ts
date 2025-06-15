import { create } from "zustand";
import createClient from "@/lib/supabase/client";
import { useAccountStore } from "@/store/userStore";
import { payTip } from "@/lib/story";

const supabase = createClient();

interface TipResponse {
  id: number;
  music_id: string;
  user_id: string;
  tip_amount: number;
  created_at: string;
  account: {
    name: string;
  } | null;
}

export interface Tip {
  id: number;
  music_id: string;
  user_id: string;
  user_name: string;
  tip_amount: number;
  created_at: string;
}

interface TrackState {
  tips: Tip[];
  likes: number;
  isLiked: boolean;
  isLoading: boolean;
  error: string | null;
  fetchTipsForMusic: (musicId: string) => Promise<void>;
  fetchTipsOfUser: (userId: string) => Promise<void>;
  addTip: (
    musicId: string,
    amount: number,
    ipId?: `0x${string}`
  ) => Promise<void>;
  fetchLikes: (musicId: string) => Promise<void>;
  toggleLike: (musicId: string) => Promise<void>;
}

export const useTrackStore = create<TrackState>((set, get) => ({
  tips: [],
  likes: 0,
  isLiked: false,
  isLoading: false,
  error: null,

  fetchTipsForMusic: async (musicId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("tip_provided")
        .select(
          `
          id,
          music_id,
          user_id,
          tip_amount,
          created_at,
          account:user_id (
            name
          )
        `
        )
        .eq("music_id", musicId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTips = (data as unknown as TipResponse[]).map((tip) => ({
        id: tip.id,
        music_id: tip.music_id,
        user_id: tip.user_id,
        user_name: tip.account?.name || "Anonymous",
        tip_amount: tip.tip_amount,
        created_at: tip.created_at,
      }));

      set({ tips: formattedTips, isLoading: false });
    } catch (error) {
      console.error("Error fetching tips:", error);
      set({ error: "Failed to fetch tips", isLoading: false });
    }
  },

  fetchTipsOfUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("tip_provided")
        .select(
          `
          id,
          music_id,
          user_id,
          tip_amount,
          created_at,
          account:user_id (
            name
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTips = (data as unknown as TipResponse[]).map((tip) => ({
        id: tip.id,
        music_id: tip.music_id,
        user_id: tip.user_id,
        user_name: tip.account?.name || "Anonymous",
        tip_amount: tip.tip_amount,
        created_at: tip.created_at,
      }));

      set({ tips: formattedTips, isLoading: false });
    } catch (error) {
      console.error("Error fetching user tips:", error);
      set({ error: "Failed to fetch user tips", isLoading: false });
    }
  },

  addTip: async (musicId: string, amount: number, ipId?: `0x${string}`) => {
    set({ isLoading: true, error: null });
    try {
      const account = useAccountStore.getState().account;
      if (!account) throw new Error("User not authenticated");

      // If ipId is provided, pay tip through Story Protocol
      if (ipId) {
        await payTip(ipId, amount.toString());
      }

      const { error } = await supabase.from("tip_provided").insert({
        music_id: musicId,
        user_id: account.id,
        tip_amount: amount,
      });

      if (error) throw error;

      // Refresh tips after adding new tip
      await get().fetchTipsForMusic(musicId);
      set({ isLoading: false });
    } catch (error) {
      console.error("Error adding tip:", error);
      set({ error: "Failed to add tip", isLoading: false });
    }
  },

  fetchLikes: async (musicId: string) => {
    set({ isLoading: true, error: null });
    try {
      const account = useAccountStore.getState().account;

      // Get total likes count
      const { count, error: countError } = await supabase
        .from("music_actions")
        .select("*", { count: "exact", head: true })
        .eq("music_id", musicId)
        .eq("action_type", "like");

      if (countError) throw countError;

      // Check if current user has liked
      let isLiked = false;
      if (account) {
        const { data: userLike, error: userLikeError } = await supabase
          .from("music_actions")
          .select("id")
          .eq("music_id", musicId)
          .eq("user_id", account.id)
          .eq("action_type", "like")
          .single();

        if (userLikeError && userLikeError.code !== "PGRST116")
          throw userLikeError;
        isLiked = !!userLike;
      }

      set({
        likes: count || 0,
        isLiked,
        isLoading: false,
      });

      return {
        likes: count || 0,
        isLiked,
      };
    } catch (error) {
      console.error("Error fetching likes:", error);
      set({ error: "Failed to fetch likes", isLoading: false });
    }
  },

  toggleLike: async (musicId: string) => {
    set({ isLoading: true, error: null });
    try {
      const account = useAccountStore.getState().account;
      if (!account) throw new Error("User not authenticated");

      const { isLiked } = get();

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("music_actions")
          .delete()
          .eq("music_id", musicId)
          .eq("user_id", account.id)
          .eq("action_type", "like");

        if (error) throw error;
        set((state) => ({
          likes: state.likes - 1,
          isLiked: false,
          isLoading: false,
        }));
      } else {
        // Like
        const { error } = await supabase.from("music_actions").insert({
          music_id: musicId,
          user_id: account.id,
          action_type: "like",
        });

        if (error) throw error;
        set((state) => ({
          likes: state.likes + 1,
          isLiked: true,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      set({ error: "Failed to toggle like", isLoading: false });
    }
  },
}));
