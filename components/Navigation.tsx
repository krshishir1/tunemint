"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { ConnectButton, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { useAccountStore } from "@/store/userStore";

export function Navigation() {
  const { wallet } = useAccountStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b-2 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center">
              <Music className="h-4 w-4 md:h-6 md:w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-black text-black">TUNEMINT</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 md:space-x-12">
            <Link
              href="/discover"
              className="text-base md:text-lg font-bold text-black hover:text-gray-600 transition-colors"
            >
              DISCOVER
            </Link>
            {wallet?.account?.address && (
              <>
                <Link
                  href="/upload"
                  className="text-base md:text-lg font-bold text-black hover:text-gray-600 transition-colors"
                >
                  UPLOAD
                </Link>
                <Link
                  href="/profile"
                  className="text-base md:text-lg font-bold text-black hover:text-gray-600 transition-colors"
                >
                  PROFILE
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <div className="md:hidden">
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
                              className="bg-black text-white hover:bg-gray-800 font-black text-sm px-4 py-2 rounded-none"
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              CONNECT
                            </Button>
                          );
                        }

                        return (
                          <Button
                            onClick={openAccountModal}
                            className="bg-black text-white hover:bg-gray-800 font-black text-sm px-4 py-2 rounded-none"
                          >
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {account.displayName}
                            </div>
                          </Button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            <Button
              variant="ghost"
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Desktop Connect Button */}
          <div className="hidden md:block">
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
                            className="bg-black text-white hover:bg-gray-800 font-black text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-none"
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
                            className="bg-red-600 text-white hover:bg-red-700 font-black text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-none"
                          >
                            WRONG NETWORK
                          </Button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-3 md:gap-4">
                          <Button
                            onClick={openChainModal}
                            className="bg-black text-white hover:bg-gray-800 font-black text-base md:text-lg px-4 md:px-6 py-3 md:py-4 rounded-none"
                          >
                            {chain.hasIcon && (
                              <div className="mr-2">
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-4 h-4 md:w-5 md:h-5"
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            className="bg-black text-white hover:bg-gray-800 font-black text-base md:text-lg px-4 md:px-6 py-3 md:py-4 rounded-none"
                          >
                            <div className="flex items-center">
                              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full mr-2 md:mr-3"></div>
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-2 border-black">
            <div className="py-4 space-y-4">
              <Link
                href="/discover"
                className="block px-4 py-2 text-base font-bold text-black hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                DISCOVER
              </Link>
              {wallet?.account?.address && (
                <>
                  <Link
                    href="/upload"
                    className="block px-4 py-2 text-base font-bold text-black hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    UPLOAD
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-base font-bold text-black hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    PROFILE
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
