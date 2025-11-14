import { useAccount, useBalance, useDisconnect, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { Copy, ExternalLink, ChevronDown, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { mainnet, bsc } from 'wagmi/chains';
import { WalletSettingsDialog } from './WalletSettingsDialog';

interface MetamaskHeaderProps {
  onBuyClick?: () => void;
  onSendClick?: () => void;
  onSwapClick?: () => void;
}

export const MetamaskHeader = ({ onBuyClick, onSendClick, onSwapClick }: MetamaskHeaderProps) => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [profile, setProfile] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    loadProfile();
  }, []);

  const getNetworkName = () => {
    if (chainId === mainnet.id) return 'Ethereum Mainnet';
    if (chainId === bsc.id) return 'BNB Smart Chain';
    return 'Unknown Network';
  };

  const getNetworkColor = () => {
    if (chainId === mainnet.id) return 'bg-[#627EEA]';
    if (chainId === bsc.id) return 'bg-[#F3BA2F]';
    return 'bg-muted';
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Đã sao chép địa chỉ');
    }
  };

  const openExplorer = () => {
    if (address) {
      const explorerUrl = chainId === mainnet.id 
        ? `https://etherscan.io/address/${address}`
        : `https://bscscan.com/address/${address}`;
      window.open(explorerUrl, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <img 
              src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
              alt="MetaMask" 
              className="w-10 h-10"
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Kết nối ví của bạn</h3>
            <p className="text-sm text-muted-foreground">
              Để bắt đầu sử dụng Web3 Wallet
            </p>
          </div>
          <ConnectButton />
        </div>
      </Card>
    );
  }

  const balanceInUSD = balance ? (parseFloat(formatEther(balance.value)) * 2500).toFixed(2) : '0.00';
  const nativeSymbol = balance?.symbol || 'ETH';

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
      {/* Network Badge */}
      <div className={`${getNetworkColor()} px-4 py-2 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-sm font-medium">{getNetworkName()}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </div>

      <div className="p-6 space-y-4">
        {/* Account Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold">{profile?.username || 'Account 1'}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={copyAddress}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={openExplorer}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Balance Display */}
        <div className="text-center py-6">
          <p className="text-4xl font-bold mb-2">
            {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'}
          </p>
          <p className="text-muted-foreground">{nativeSymbol}</p>
          <p className="text-sm text-muted-foreground mt-1">
            ≈ ${balanceInUSD} USD
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            className="flex-col h-auto py-3 gap-1"
            onClick={() => {
              toast.info('Tính năng mua crypto sẽ sớm có sẵn!');
              onBuyClick?.();
            }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <span className="text-lg">💸</span>
            </div>
            <span className="text-xs">Mua</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-auto py-3 gap-1"
            onClick={onSendClick}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <span className="text-lg">📤</span>
            </div>
            <span className="text-xs">Gửi</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-auto py-3 gap-1"
            onClick={() => {
              toast.info('Tính năng hoán đổi sẽ sớm có sẵn!');
              onSwapClick?.();
            }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <span className="text-lg">🔄</span>
            </div>
            <span className="text-xs">Hoán đổi</span>
          </Button>
        </div>

        {/* Disconnect Button */}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => disconnect()}
          className="w-full"
        >
          Ngắt kết nối
        </Button>
      </div>
      
      <WalletSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Card>
  );
};
