import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { toast } from 'sonner';
import { Plus, Send } from 'lucide-react';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { validateSolanaAddress } from '@/utils/walletValidation';

// Common SPL tokens on Solana
const COMMON_TOKENS = [
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
];

interface SolanaToken {
  symbol: string;
  mint: string;
  decimals: number;
  balance?: string;
}

export const SolanaTokenManager = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<SolanaToken[]>(COMMON_TOKENS);
  const [newTokenMint, setNewTokenMint] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<SolanaToken | null>(null);

  const addCustomToken = async () => {
    if (!newTokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    if (!validateSolanaAddress(newTokenMint)) {
      return;
    }

    try {
      const newToken: SolanaToken = {
        symbol: 'CUSTOM',
        mint: newTokenMint,
        decimals: 9,
      };

      setTokens([...tokens, newToken]);
      setNewTokenMint('');
      toast.success('Token added successfully!');
    } catch (error) {
      console.error('Error adding token:', error);
      toast.error('Error adding token');
    }
  };

  const sendToken = async () => {
    if (!selectedToken || !sendAddress || !sendAmount || !publicKey) {
      toast.error('Please fill all fields and connect wallet');
      return;
    }

    if (!validateSolanaAddress(sendAddress)) {
      return;
    }

    const confirmMessage = `Send ${sendAmount} ${selectedToken.symbol} to ${sendAddress.slice(0, 6)}...${sendAddress.slice(-4)}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const recipientPubkey = new PublicKey(sendAddress);
      const mintPubkey = new PublicKey(selectedToken.mint);
      const amount = parseFloat(sendAmount) * Math.pow(10, selectedToken.decimals);

      // Get associated token accounts
      const senderTokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);
      const recipientTokenAccount = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

      const transaction = new Transaction().add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Token sent successfully!');
      setSendAddress('');
      setSendAmount('');
    } catch (error) {
      console.error('Error sending token:', error);
      toast.error('Error sending token');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SPL Token Balances</CardTitle>
          <CardDescription>Manage your Solana tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokens.map((token, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{token.mint}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedToken(token)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          ))}

          <div className="pt-4 border-t space-y-3">
            <Label>Add Custom Token</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Token mint address"
                value={newTokenMint}
                onChange={(e) => setNewTokenMint(e.target.value)}
              />
              <Button onClick={addCustomToken} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedToken && (
        <Card>
          <CardHeader>
            <CardTitle>Send {selectedToken.symbol}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Address</Label>
              <Input
                placeholder="Solana address"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={sendToken} className="flex-1">
                Send {selectedToken.symbol}
              </Button>
              <Button variant="outline" onClick={() => setSelectedToken(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
