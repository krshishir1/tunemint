"use client";

import { aeneid, mainnet } from "@story-protocol/core-sdk";
import { Chain } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import {
  NetworkType,
  CHAIN_ID_TO_NETWORK,
  NETWORK_CONFIGS,
} from "@/lib/constants";
import { useEffect } from "react";
import { useAccountStore } from "@/store/userStore";

interface AccountProviderIf {
  children: React.ReactNode;
}

export default function AccountProvider({ children }: AccountProviderIf) {
  const { chain } = useAccount();
  const { data: currWallet } = useWalletClient();
  const { setNetwork, network, setWallet, setupStoryClient, registerAccount  } = useAccountStore();

  const networkType: NetworkType =
    chain?.id && CHAIN_ID_TO_NETWORK[chain.id]
      ? CHAIN_ID_TO_NETWORK[chain.id]
      : "aeneid";

  const config = NETWORK_CONFIGS[networkType];

  useEffect(() => {
    setNetwork(networkType);
    console.log(
      `Network: ${networkType} (Chain: ${chain?.name || "disconnected"})`
    );
  }, [networkType, chain, config]);

  useEffect(() => {

    console.log("Current wallet configs:", currWallet)

    if (currWallet?.account?.address) {
      console.log(currWallet)  
      console.log(
        `Wallet or network (${network}) changed - recreating Story client`
      );
      setWallet(currWallet)
      setupStoryClient()
      registerAccount()
    }

    
  }, [currWallet, network]);

  return <>{children}</>;
}
