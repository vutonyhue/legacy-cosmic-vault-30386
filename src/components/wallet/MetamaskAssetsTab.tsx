import { useState } from 'react';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, bsc } from 'wagmi/chains';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatEther } from 'viem';
import { ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const MetamaskAssetsTab = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance, refetch } = useBalance({ address });
  const [refreshing, setRefreshing] = useState(false);

  const currentChain = chainId === mainnet.id ? 'Ethereum' : chainId === bsc.id ? 'BSC' : 'Unknown';
  const nativeToken = chainId === mainnet.id ? 'ETH' : 'BNB';
  const tokenIcon = chainId === mainnet.id ? '⟠' : '◆';

  const handleSwitchNetwork = (targetChainId: number) => {
    switchChain({ chainId: targetChainId });
    toast.success(`Đã chuyển sang ${targetChainId === mainnet.id ? 'Ethereum' : 'BSC'}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Đã cập nhật số dư');
    }, 500);
  };

  const balanceValue = balance ? parseFloat(formatEther(balance.value)).toFixed(6) : '0.000000';
  const balanceInUSD = balance ? (parseFloat(formatEther(balance.value)) * 2500).toFixed(2) : '0.00';

  return (
    <div className="space-y-4">
      {/* Network Tabs */}
      <Tabs value={String(chainId)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value={String(mainnet.id)}
            onClick={() => handleSwitchNetwork(mainnet.id)}
          >
            <span className="mr-2">⟠</span>
            Ethereum
          </TabsTrigger>
          <TabsTrigger 
            value={String(bsc.id)}
            onClick={() => handleSwitchNetwork(bsc.id)}
          >
            <span className="mr-2">◆</span>
            BSC
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Assets & Activity Tabs */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Tài sản</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-3 mt-4">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

          {/* Native Token */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white text-xl font-bold">
                    {tokenIcon}
                  </div>
                  <div>
                    <p className="font-semibold">{nativeToken}</p>
                    <p className="text-sm text-muted-foreground">
                      {balanceValue} {nativeToken}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${balanceInUSD}</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Tokens Button */}
          <Button 
            variant="outline" 
            className="w-full justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nhập token
          </Button>

          {/* Info Text */}
          <p className="text-xs text-center text-muted-foreground py-4">
            Bạn chưa có token nào khác. Nhập token để xem số dư.
          </p>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3 mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-muted-foreground mb-2">
                Bạn chưa có hoạt động nào
              </p>
              <p className="text-sm text-muted-foreground">
                Giao dịch của bạn sẽ xuất hiện ở đây
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
