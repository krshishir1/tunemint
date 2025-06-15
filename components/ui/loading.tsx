import { Loader2 } from "lucide-react";

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-xl font-bold">{message}</p>
      </div>
    </div>
  );
} 