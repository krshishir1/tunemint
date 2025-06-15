import { useEffect, useState } from "react";
import { useAccountStore } from "@/store/userStore";
import { LoadingScreen } from "@/components/ui/loading";
import { useRouter } from "next/navigation";

export function withWallet<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireWallet: boolean = true
) {
  return function WithWalletComponent(props: P) {
    const { account, isLoading } = useAccountStore();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      if (!isLoading) {
        if (requireWallet && !account) {
          router.push("/");
        }
        setIsChecking(false);
      }
    }, [isLoading, account, requireWallet, router]);

    if (isLoading || isChecking) {
      return <LoadingScreen message="Checking wallet connection..." />;
    }

    if (requireWallet && !account) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };
} 