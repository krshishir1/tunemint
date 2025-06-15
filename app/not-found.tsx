import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl md:text-9xl font-black mb-6">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">PAGE NOT FOUND</h2>
        <p className="text-lg md:text-xl mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-black text-white hover:bg-gray-800 text-lg font-black px-8 py-6 rounded-none">
            <ArrowLeft className="mr-2 h-5 w-5" />
            BACK TO HOME
          </Button>
        </Link>
      </div>
    </div>
  );
} 