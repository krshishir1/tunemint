import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Shield, Coins, Zap, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative py-16 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80"
            alt="Music Studio"
            fill
            className="object-cover brightness-[0.3]"
            priority
          />
        </div>
        
        <div className="relative z-0 max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6 md:mb-8 leading-tight text-white">
            DECENTRALIZED
            <br />
            <span className="text-white">MUSIC</span>
            <br />
            LICENSING
          </h1>
          <p className="text-xl md:text-2xl font-bold max-w-4xl mx-auto mb-8 md:mb-16 leading-relaxed px-4 text-white">
            LICENSE MUSIC IP ON-CHAIN WITH STORY PROTOCOL. 
            CONNECT, DISCOVER, AND LICENSE HIGH-QUALITY MUSIC 
            IN THE DECENTRALIZED ECONOMY.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Link href="/discover">
              <Button className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-lg md:text-xl font-black px-8 md:px-12 py-6 md:py-8 rounded-none">
                DISCOVER MUSIC
                <ArrowRight className="ml-4 h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-6">WHY TUNEMINT?</h2>
            <p className="text-xl md:text-2xl font-bold max-w-3xl mx-auto px-4">
              BUILT FOR THE FUTURE OF MUSIC LICENSING WITH BLOCKCHAIN TECHNOLOGY
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <Card className="bg-white text-black border-4 border-black rounded-none group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 md:p-12 text-center">
                <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8">
                  <Image
                    src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80"
                    alt="On-chain Licensing"
                    fill
                    className="object-cover rounded-full border-4 border-black"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">ON-CHAIN LICENSING</h3>
                <p className="text-base md:text-lg font-bold leading-relaxed">
                  IMMUTABLE LICENSING RECORDS POWERED BY STORY PROTOCOL. 
                  YOUR RIGHTS ARE PROTECTED FOREVER.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white text-black border-4 border-black rounded-none group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 md:p-12 text-center">
                <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8">
                  <Image
                    src="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80"
                    alt="Instant Payments"
                    fill
                    className="object-cover rounded-full border-4 border-black"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">INSTANT PAYMENTS</h3>
                <p className="text-base md:text-lg font-bold leading-relaxed">
                  GET PAID IMMEDIATELY WHEN YOUR MUSIC IS LICENSED. 
                  NO WAITING, NO MIDDLEMEN.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white text-black border-4 border-black rounded-none group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 md:p-12 text-center">
                <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8">
                  <Image
                    src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80"
                    alt="AI-Powered Discovery"
                    fill
                    className="object-cover rounded-full border-4 border-black"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">AI-POWERED DISCOVERY</h3>
                <p className="text-base md:text-lg font-bold leading-relaxed">
                  FIND THE PERFECT TRACK WITH OUR INTELLIGENT 
                  RECOMMENDATION SYSTEM.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 md:py-24 bg-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-5">
          <Image
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80"
            alt="Background Pattern"
            fill
            className="object-cover"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-center">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl md:text-6xl font-black text-black mb-2 md:mb-4">10K+</div>
              <div className="text-base md:text-xl font-bold text-black">TRACKS LICENSED</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl md:text-6xl font-black text-black mb-2 md:mb-4">2.5K</div>
              <div className="text-base md:text-xl font-bold text-black">ACTIVE CREATORS</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl md:text-6xl font-black text-black mb-2 md:mb-4">$1.2M</div>
              <div className="text-base md:text-xl font-bold text-black">PAID TO ARTISTS</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl md:text-6xl font-black text-black mb-2 md:mb-4">99%</div>
              <div className="text-base md:text-xl font-bold text-black">UPTIME</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-32 bg-black text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80"
            alt="Music Studio"
            fill
            className="object-cover brightness-[0.2]"
          />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 md:mb-8">READY TO START?</h2>
          <p className="text-xl md:text-2xl font-bold mb-8 md:mb-16 px-4">
            JOIN THOUSANDS OF CREATORS BUILDING THE FUTURE OF MUSIC IP
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Link href="/discover">
              <Button className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-lg md:text-xl font-black px-8 md:px-12 py-6 md:py-8 rounded-none">
                BROWSE CATALOG
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}