import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { mainnet, bsc } from 'wagmi/chains';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();

  const getNetworkName = () => {
    if (chainId === mainnet.id) return 'Ethereum';
    if (chainId === bsc.id) return 'BSC';
    return 'Testnet';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          EVM Wallet
        </CardTitle>
        <CardDescription>Ethereum & BSC - Connect your wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectButton />
        {isConnected && address && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <p className="font-medium">Network: {getNetworkName()}</p>
              <p className="font-medium mt-2">Connected Wallet</p>
              <p className="text-xs text-muted-foreground truncate">{address}</p>
            </div>
            {balance && (
              <div className="text-sm">
                <p className="font-medium">Balance</p>
                <p className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
