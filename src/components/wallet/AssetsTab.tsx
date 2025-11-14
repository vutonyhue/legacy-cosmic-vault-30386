import { useState } from 'react';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, bsc } from 'wagmi/chains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatEther } from 'viem';

export const AssetsTab = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const currentChain = chainId === mainnet.id ? 'Ethereum' : chainId === bsc.id ? 'BSC' : 'Unknown';
  const nativeToken = chainId === mainnet.id ? 'ETH' : 'BNB';

  const handleSwitchNetwork = (targetChainId: number) => {
    switchChain({ chainId: targetChainId });
  };

  if (selectedToken) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedToken(null)}>
          ← Quay lại
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>{selectedToken}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Số dư</p>
              <p className="text-2xl font-bold">
                {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} {selectedToken}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm">Nhận</Button>
              <Button variant="outline" size="sm">Gửi</Button>
              <Button variant="outline" size="sm">Lịch sử</Button>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">10 giao dịch gần nhất</h3>
              <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={chainId === mainnet.id ? 'default' : 'outline'}
          onClick={() => handleSwitchNetwork(mainnet.id)}
        >
          Ethereum
        </Button>
        <Button
          variant={chainId === bsc.id ? 'default' : 'outline'}
          onClick={() => handleSwitchNetwork(bsc.id)}
        >
          BSC
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentChain} Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div 
            className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => setSelectedToken(nativeToken)}
          >
            <div>
              <p className="font-medium">{nativeToken}</p>
              <p className="text-sm text-muted-foreground">Native Token</p>
            </div>
            <p className="font-bold">
              {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground text-center py-4">
            Thêm token tùy chỉnh để xem thêm số dư
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
