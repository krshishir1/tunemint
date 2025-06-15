import { create } from 'zustand';
import { NetworkConfig, NetworkType, NETWORK_CONFIGS, getCurrentNetworkConfig, Account } from '../lib/constants';
import {
    StoryClient,
    StoryConfig,
    SupportedChainIds,
} from "@story-protocol/core-sdk";
import { custom } from "viem";
import createClient from "@/lib/supabase/client"
import { generateRandomProfile } from '@/lib/utils';

const supabase = createClient()

interface NetworkState {
  network: NetworkType;
  config: NetworkConfig;
  wallet: any;
  storyClient: StoryClient | null | undefined;
  account: Account | null;
  setNetwork: (network: NetworkType) => void;
  setWallet: (wallet: any) => void;
  setupStoryClient: () => void;
  registerAccount: () => Promise<void>;
  updateAccount: (updates: Partial<Account>) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<string>;
}

export const useAccountStore = create<NetworkState>((set, get) => ({
  network: 'aeneid',
  config: NETWORK_CONFIGS.aeneid,
  wallet: null,
  storyClient: null,
  account: null,
  setNetwork: (network: NetworkType) => set({
    network,
    config: NETWORK_CONFIGS[network]
  }),
  setWallet: (wallet: any) => set({ wallet }),
  setupStoryClient: () => {
    const { wallet, network } = get();
    
    if (!wallet || !wallet.account || !wallet.transport) {
      console.error("Wallet is not fully initialized");
      return;
    }

    const networkConfig = NETWORK_CONFIGS[network];
    const chainId = networkConfig.name as SupportedChainIds;

    console.log(
      `Setting up Story client with chainId: ${chainId} for network: ${networkConfig.name}`
    );

    try {
      const config: StoryConfig = {
        wallet: wallet,
        transport: custom(wallet.transport),
        chainId: chainId,
      };
      const client = StoryClient.newClient(config);
      set({ storyClient: client });
    } catch (error) {
      console.error("Error creating Story client:", error);
    }
  },
  registerAccount: async () => {
    const { wallet } = get();
    if (!wallet?.account?.address) {
      throw new Error("Wallet not connected");
    }

    try {
      // First check if account exists with this wallet address
      const { data: existingAccount, error: fetchError } = await supabase
        .from('account')
        .select()
        .eq('wallet_address', wallet.account.address)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw fetchError;
      }

      // If account exists, return it
      if (existingAccount) {
        set({ account: existingAccount });
        return;
      }

      // If no account exists, create new one
      const randomProf = await generateRandomProfile();
      const { data, error } = await supabase
        .from('account')
        .insert([
          {
            username: randomProf.username,
            name: randomProf.name,
            bio: "",
            avatar_url: randomProf.avatar_url,
            wallet_address: wallet.account.address,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      set({ account: data });
    } catch (error) {
      console.error("Error registering account:", error);
      throw error;
    }
  },
  updateAccount: async (updates: Partial<Account>) => {
    const { account } = get();
    if (!account?.id) {
      throw new Error("No account found");
    }

    try {
      const { data, error } = await supabase
        .from('account')
        .update(updates)
        .eq('id', account.id)
        .select()
        .single();

      if (error) throw error;
      set({ account: data });
    } catch (error) {
      console.error("Error updating account:", error);
      throw error;
    }
  },
  uploadProfilePhoto: async (file: File): Promise<string> => {
    const { account } = get();
    if (!account?.id) {
      throw new Error("No account found");
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${account.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = await supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update account with new profile photo URL
      await get().updateAccount({ avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      throw error;
    }
  }
}));
