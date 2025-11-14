import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { validateEvmAddress } from '@/utils/walletValidation';

export const SendCrypto = () => {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const { sendTransaction, isPending } = useSendTransaction();

  const handleSend = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate recipient address
    if (!validateEvmAddress(recipient)) {
      return; // validateEvmAddress already shows error toast
    }

    // Confirm transaction
    const confirmMessage = `Send ${amount} ETH/BNB to ${recipient.slice(0, 6)}...${recipient.slice(-4)}?`;
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
          onSuccess: () => {
            toast.success('Transaction sent successfully!');
            setRecipient('');
            setAmount('');
          },
          onError: (error) => {
            toast.error(error.message || 'Transaction failed');
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to send transaction');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send Crypto</CardTitle>
        <CardDescription>Send ETH or BNB to any address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
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
          {isPending ? 'Sending...' : 'Send'}
        </Button>
      </CardContent>
    </Card>
  );
};
