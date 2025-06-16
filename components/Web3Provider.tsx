"use client";

import '@tomo-inc/tomo-evm-kit/styles.css';
// import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { aeneid, mainnet } from "@story-protocol/core-sdk";
import { getDefaultConfig, TomoEVMKitProvider } from '@tomo-inc/tomo-evm-kit';


const config = getDefaultConfig({
  appName: "Tunemint",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  clientId: process.env.NEXT_PUBLIC_TOMO_CLIENT_ID as string,
  chains: [aeneid, mainnet], // Support both testnet and mainnet
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export default function Web3Provider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider>{children}</TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
