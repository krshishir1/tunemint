import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Shield, Coins, Zap, ArrowRight, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-8xl md:text-9xl font-black tracking-tight mb-8 leading-none">
            DECENTRALIZED
            <br />
            <span className="text-black">MUSIC</span>
            <br />
            LICENSING
          </h1>
          <p className="text-2xl font-bold max-w-4xl mx-auto mb-16 leading-relaxed">
            LICENSE MUSIC IP ON-CHAIN WITH STORY PROTOCOL. 
            CONNECT, DISCOVER, AND LICENSE HIGH-QUALITY MUSIC 
            IN THE DECENTRALIZED ECONOMY.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button className="bg-black text-white hover:bg-gray-800 text-xl font-black px-12 py-8 rounded-none">
              CONNECT WALLET & DISCOVER
              <ArrowRight className="ml-4 h-6 w-6" />
            </Button>
            <Button variant="outline" className="border-4 border-black text-black hover:bg-black hover:text-white text-xl font-black px-12 py-8 rounded-none">
              LEARN MORE
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black mb-6">WHY TUNEMINT?</h2>
            <p className="text-2xl font-bold max-w-3xl mx-auto">
              BUILT FOR THE FUTURE OF MUSIC LICENSING WITH BLOCKCHAIN TECHNOLOGY
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <Card className="bg-white text-black border-4 border-black rounded-none">
              <CardContent className="p-12 text-center">
                <Shield className="h-16 w-16 text-black mx-auto mb-8" />
                <h3 className="text-2xl font-black mb-6">ON-CHAIN LICENSING</h3>
                <p className="text-lg font-bold leading-relaxed">
                  IMMUTABLE LICENSING RECORDS POWERED BY STORY PROTOCOL. 
                  YOUR RIGHTS ARE PROTECTED FOREVER.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white text-black border-4 border-black rounded-none">
              <CardContent className="p-12 text-center">
                <Coins className="h-16 w-16 text-black mx-auto mb-8" />
                <h3 className="text-2xl font-black mb-6">INSTANT PAYMENTS</h3>
                <p className="text-lg font-bold leading-relaxed">
                  GET PAID IMMEDIATELY WHEN YOUR MUSIC IS LICENSED. 
                  NO WAITING, NO MIDDLEMEN.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white text-black border-4 border-black rounded-none">
              <CardContent className="p-12 text-center">
                <Zap className="h-16 w-16 text-black mx-auto mb-8" />
                <h3 className="text-2xl font-black mb-6">AI-POWERED DISCOVERY</h3>
                <p className="text-lg font-bold leading-relaxed">
                  FIND THE PERFECT TRACK WITH OUR INTELLIGENT 
                  RECOMMENDATION SYSTEM.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-6xl font-black text-black mb-4">10K+</div>
              <div className="text-xl font-bold text-black">TRACKS LICENSED</div>
            </div>
            <div>
              <div className="text-6xl font-black text-black mb-4">2.5K</div>
              <div className="text-xl font-bold text-black">ACTIVE CREATORS</div>
            </div>
            <div>
              <div className="text-6xl font-black text-black mb-4">$1.2M</div>
              <div className="text-xl font-bold text-black">PAID TO ARTISTS</div>
            </div>
            <div>
              <div className="text-6xl font-black text-black mb-4">99%</div>
              <div className="text-xl font-bold text-black">UPTIME</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-6xl font-black mb-8">READY TO START?</h2>
          <p className="text-2xl font-bold mb-16">
            JOIN THOUSANDS OF CREATORS BUILDING THE FUTURE OF MUSIC IP
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/upload">
              <Button className="bg-white text-black hover:bg-gray-200 text-xl font-black px-12 py-8 rounded-none">
                UPLOAD YOUR MUSIC
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline" className="border-4 border-white text-white hover:bg-white hover:text-black text-xl font-black px-12 py-8 rounded-none">
                BROWSE CATALOG
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}