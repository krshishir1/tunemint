import { create } from "zustand";
import createClient from "@/lib/supabase/client";
import { mintLicense, payTip, claimRevenue } from "@/lib/story";

const supabase = createClient();

type LicenseState = {
  licenses: any[];
  royaltyPayments: any[];
  royaltyClaims: any[];
  isLoading: boolean;
  error: string | null;
  fetchLicenses: (musicId: string) => Promise<void>;
  fetchRoyaltyPayments: (musicId: string) => Promise<void>;
  fetchRoyaltyClaims: (musicId: string) => Promise<void>;
  mintLicense: (musicId: string, accountId: string) => Promise<void>;
  payRoyalty: (musicId: string, licenseId: string, amount: string) => Promise<void>;
  claimRoyalty: (musicId: string, ipId: string) => Promise<void>;
  refreshState: (musicId: string) => Promise<void>;
};

export const useLicenseStore = create<LicenseState>((set, get) => ({
  licenses: [],
  royaltyPayments: [],
  royaltyClaims: [],
  isLoading: false,
  error: null,

  fetchLicenses: async (musicId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("licenses")
        .select(`
          *,
          music:music_id (
            title,
            ip_id,
            license_id,
            account:account_id (
              name,
              wallet_address
            )
          ),
          licensor:licensor_account_id (
            name,
            wallet_address
          )
        `)
        .eq("music_id", musicId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ licenses: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching licenses:", error);
      set({ error: "Failed to fetch licenses", isLoading: false });
    }
  },

  fetchRoyaltyPayments: async (musicId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("royalty_payments")
        .select(`
          *,
          license:license_id (
            licensor:licensor_account_id (
              name,
              wallet_address
            )
          )
        `)
        .eq("music_id", musicId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ royaltyPayments: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching royalty payments:", error);
      set({ error: "Failed to fetch royalty payments", isLoading: false });
    }
  },

  fetchRoyaltyClaims: async (musicId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("royalty_claims")
        .select(`
          *,
          music:music_id (
            title,
            ip_id,
            account:account_id (
              name,
              wallet_address
            )
          )
        `)
        .eq("music_id", musicId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ royaltyClaims: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching royalty claims:", error);
      set({ error: "Failed to fetch royalty claims", isLoading: false });
    }
  },

  refreshState: async (musicId: string) => {
    await Promise.all([
      get().fetchLicenses(musicId),
      get().fetchRoyaltyPayments(musicId),
      get().fetchRoyaltyClaims(musicId)
    ]);
  },

  mintLicense: async (musicId: string, accountId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get music details first
      const { data: music, error: musicError } = await supabase
        .from("music_uploads")
        .select("*")
        .eq("id", musicId)
        .single();

      if (musicError) throw musicError;

      if (!music.ip_id || !music.license_id) {
        throw new Error("Music IP or license ID not found");
      }

      // Call Story Protocol to mint license
      const response = await mintLicense(music.ip_id as `0x${string}`, music.license_id);

      // Record license in database
      const { data, error } = await supabase
        .from("licenses")
        .insert([
          {
            music_id: musicId,
            licensor_account_id: accountId,
            transaction_hash: response.txHash,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the state to show the new license
      await get().refreshState(musicId);
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error minting license:", error);
      set({ error: "Failed to mint license", isLoading: false });
      throw error;
    }
  },

  payRoyalty: async (musicId: string, licenseId: string, amount: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get music details
      const { data: music, error: musicError } = await supabase
        .from("music_uploads")
        .select("ip_id")
        .eq("id", musicId)
        .single();

      if (musicError) throw musicError;

      if (!music.ip_id) {
        throw new Error("Music IP ID not found");
      }

      // Call Story Protocol to pay royalty
      await payTip(music.ip_id as `0x${string}`, amount);

      // Record royalty payment
      const { error: paymentError } = await supabase
        .from("royalty_payments")
        .insert([
          {
            music_id: musicId,
            license_id: licenseId,
            amount: parseFloat(amount),
          },
        ]);

      if (paymentError) throw paymentError;

      // Refresh the state to show the new royalty payment
      await get().refreshState(musicId);
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error paying royalty:", error);
      set({ error: "Failed to pay royalty", isLoading: false });
      throw error;
    }
  },

  claimRoyalty: async (musicId: string, ipId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get music details including royalty percentage
      const { data: music, error: musicError } = await supabase
        .from("music_uploads")
        .select("pricing")
        .eq("id", musicId)
        .single();

      if (musicError) throw musicError;

      const royaltyPercentage = music.pricing?.royalty || 0;

      // Get unclaimed royalty payments
      const { data: payments, error: paymentsError } = await supabase
        .from("royalty_payments")
        .select("amount")
        .eq("music_id", musicId)
        .eq("is_claimed", false);

      if (paymentsError) throw paymentsError;

      // Calculate total amount based on royalty percentage
      const totalAmount = payments.reduce((sum, payment) => {
        const claimableAmount = (payment.amount * royaltyPercentage) / 100;
        return sum + claimableAmount;
      }, 0);

      // Call Story Protocol to claim revenue
      await claimRevenue(ipId as `0x${string}`);

      // Record the claim
      const { error: claimError } = await supabase
        .from("royalty_claims")
        .insert([
          {
            music_id: musicId,
            amount: totalAmount,
            status: "claimed",
            claimed_at: new Date().toISOString()
          }
        ]);

      if (claimError) throw claimError;

      // Update all unclaimed payments to claimed
      const { error: updateError } = await supabase
        .from("royalty_payments")
        .update({ is_claimed: true })
        .eq("music_id", musicId)
        .eq("is_claimed", false);

      if (updateError) throw updateError;

      // Refresh the state
      await get().refreshState(musicId);
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error claiming royalty:", error);
      set({ error: "Failed to claim royalty", isLoading: false });
      throw error;
    }
  },
})); 