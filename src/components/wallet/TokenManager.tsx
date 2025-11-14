import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { toast } from 'sonner';
import { Plus, Send } from 'lucide-react';
import { validateEvmAddress } from '@/utils/walletValidation';

// ERC20 ABI for basic token operations
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

// Common tokens on BSC and Ethereum
const COMMON_TOKENS: Record<number, Array<{ symbol: string; address: `0x${string}`; decimals: number }>> = {
  56: [ // BSC Mainnet
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { symbol: 'BITCOIN', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18 },
    { symbol: 'CAMLY', address: '0x1111111111111111111111111111111111111111', decimals: 18 }, // Replace with actual CAMLY address
  ],
  1: [ // Ethereum Mainnet
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  ],
};

interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  balance?: string;
}

export const TokenManager = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract } = useWriteContract();
  const [tokens, setTokens] = useState<Token[]>(COMMON_TOKENS[chainId] || []);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const addCustomToken = async () => {
    if (!newTokenAddress) {
      toast.error('Please enter a token address');
      return;
    }

    if (!validateEvmAddress(newTokenAddress)) {
      return;
    }

    try {
      const tokenAddress = newTokenAddress as `0x${string}`;
      
      // This would need actual contract reads - simplified for demo
      const newToken: Token = {
        symbol: 'CUSTOM',
        address: tokenAddress,
        decimals: 18,
      };

      setTokens([...tokens, newToken]);
      setNewTokenAddress('');
      toast.success('Token added successfully!');
    } catch (error) {
      console.error('Error adding token:', error);
      toast.error('Error adding token');
    }
  };

  const sendToken = async () => {
    if (!selectedToken || !sendAddress || !sendAmount) {
      toast.error('Please fill all fields');
      return;
    }

    if (!validateEvmAddress(sendAddress)) {
      return;
    }

    const confirmMessage = `Send ${sendAmount} ${selectedToken.symbol} to ${sendAddress.slice(0, 6)}...${sendAddress.slice(-4)}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const amount = parseUnits(sendAmount, selectedToken.decimals);
      
      writeContract({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [sendAddress as `0x${string}`, amount],
      } as any);

      toast.success('Transaction submitted!');
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
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Manage your ERC20 tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokens.map((token, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{token.address}</p>
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
                placeholder="Token contract address (0x...)"
                value={newTokenAddress}
                onChange={(e) => setNewTokenAddress(e.target.value)}
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
                placeholder="0x..."
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
