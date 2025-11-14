import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const SolanaWallet = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey && connected) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL);
      });
    } else {
      setBalance(null);
    }
  }, [publicKey, connected, connection]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Solana Wallet
        </CardTitle>
        <CardDescription>Connect your Solana wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <WalletMultiButton />
        {connected && publicKey && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <p className="font-medium">Connected Wallet</p>
              <p className="text-xs text-muted-foreground truncate">{publicKey.toBase58()}</p>
            </div>
            {balance !== null && (
              <div className="text-sm">
                <p className="font-medium">Balance</p>
                <p className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  {balance.toFixed(4)} SOL
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
