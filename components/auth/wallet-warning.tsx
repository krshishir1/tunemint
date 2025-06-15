import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalletWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletWarning({ open, onOpenChange }: WalletWarningProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-4 border-black rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center">
            CONNECT YOUR WALLET
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-6">
          <p className="text-lg font-bold text-gray-600">
            Please connect your wallet to perform this action
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 