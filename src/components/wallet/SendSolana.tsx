import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner';

export const SendSolana = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSend = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsPending(true);
      const recipientPubkey = new PublicKey(recipient);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Transaction sent successfully!');
      setRecipient('');
      setAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send transaction');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send SOL</CardTitle>
        <CardDescription>Send Solana to any address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sol-recipient">Recipient Address</Label>
          <Input
            id="sol-recipient"
            placeholder="Solana address..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sol-amount">Amount (SOL)</Label>
          <Input
            id="sol-amount"
            type="number"
            step="0.001"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!connected || isPending}
          className="w-full"
        >
          {isPending ? 'Sending...' : 'Send'}
        </Button>
      </CardContent>
    </Card>
  );
};
