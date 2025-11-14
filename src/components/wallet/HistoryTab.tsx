import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Transaction {
  id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_symbol: string;
  chain_id: number;
  status: string;
  created_at: string;
}

export const HistoryTab = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!address) return;

      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
            setTransactions(data);
          }
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [address]);

  const getExplorerUrl = (txHash: string, chainId: number) => {
    if (chainId === 1) {
      return `https://etherscan.io/tx/${txHash}`;
    } else if (chainId === 56) {
      return `https://bscscan.com/tx/${txHash}`;
    }
    return '#';
  };

  const getExplorerName = (chainId: number) => {
    return chainId === 1 ? 'Etherscan' : 'BscScan';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giao dịch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có giao dịch nào được thực hiện qua F.U. Profile
          </p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">
                    {tx.from_address.toLowerCase() === address?.toLowerCase() ? 'Đã gửi' : 'Đã nhận'} {tx.amount} {tx.token_symbol}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.from_address.toLowerCase() === address?.toLowerCase() 
                      ? `Đến: ${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`
                      : `Từ: ${tx.from_address.slice(0, 6)}...${tx.from_address.slice(-4)}`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: vi })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(tx.tx_hash, tx.chain_id), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  tx.status === 'success' ? 'bg-green-500/20 text-green-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {tx.status === 'pending' ? 'Đang xử lý' : 
                   tx.status === 'success' ? 'Thành công' : 'Thất bại'}
                </span>
              </div>
            </div>
          ))
        )}

        {transactions.length > 0 && (
          <div className="pt-2 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getExplorerUrl('', chainId), '_blank')}
            >
              Xem chi tiết trên {getExplorerName(chainId)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
