"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Wallet } from "lucide-react";
import { useState } from "react";
import { ConnectButton, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { useAccountStore } from "@/store/userStore";

export function Navigation() {
  const { wallet } = useAccountStore();

  return (
    <nav className="border-b-2 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Music className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-black">TUNEMINT</span>
          </Link>

          <div className="hidden md:flex items-center space-x-12">
            <Link
              href="/discover"
              className="text-lg font-bold text-black hover:text-gray-600 transition-colors"
            >
              DISCOVER
            </Link>
            {wallet?.account?.address && (
              <>
                <Link
                  href="/upload"
                  className="text-lg font-bold text-black hover:text-gray-600 transition-colors"
                >
                  UPLOAD
                </Link>
                <Link
                  href="/profile"
                  className="text-lg font-bold text-black hover:text-gray-600 transition-colors"
                >
                  PROFILE
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            className="bg-black text-white hover:bg-gray-800 font-black text-lg px-8 py-4 rounded-none"
                          >
                            <Wallet className="w-5 h-5 mr-3" />
                            CONNECT
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            className="bg-red-600 text-white hover:bg-red-700 font-black text-lg px-8 py-4 rounded-none"
                          >
                            WRONG NETWORK
                          </Button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={openChainModal}
                            className="bg-black text-white hover:bg-gray-800 font-black text-lg px-6 py-4 rounded-none"
                          >
                            {chain.hasIcon && (
                              <div className="mr-2">
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-5 h-5"
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            className="bg-black text-white hover:bg-gray-800 font-black text-lg px-6 py-4 rounded-none"
                          >
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                              {account.displayName}
                            </div>
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
  );
}
