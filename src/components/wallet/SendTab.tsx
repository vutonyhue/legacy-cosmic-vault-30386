import { useState } from 'react';
import { useAccount, useSendTransaction, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { validateEvmAddress } from '@/utils/walletValidation';
import { supabase } from '@/integrations/supabase/client';

export const SendTab = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { sendTransaction, isPending } = useSendTransaction();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const nativeToken = chainId === 1 ? 'ETH' : 'BNB';

  const handleSend = async () => {
    if (!isConnected || !address) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }

    if (!recipient || !amount) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!validateEvmAddress(recipient)) {
      return;
    }

    const confirmMessage = `Gửi ${amount} ${nativeToken} đến ${recipient.slice(0, 6)}...${recipient.slice(-4)}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      sendTransaction(
        {
          to: recipient as `0x${string}`,
          value: parseEther(amount),
        },
        {
          onSuccess: async (hash) => {
            toast.success('Giao dịch đã được gửi!');
            
            // Save transaction to database
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('transactions').insert({
                user_id: user.id,
                tx_hash: hash,
                from_address: address,
                to_address: recipient,
                amount: amount,
                token_symbol: nativeToken,
                chain_id: chainId,
                status: 'pending'
              });
            }
            
            setRecipient('');
            setAmount('');
          },
          onError: (error) => {
            toast.error(error.message || 'Giao dịch thất bại');
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi giao dịch');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gửi {nativeToken}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Địa chỉ người nhận</Label>
          <Input
            id="recipient"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Số lượng ({nativeToken})</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!isConnected || isPending}
          className="w-full"
        >
          {isPending ? 'Đang gửi...' : 'Gửi'}
        </Button>
      </CardContent>
    </Card>
  );
};
