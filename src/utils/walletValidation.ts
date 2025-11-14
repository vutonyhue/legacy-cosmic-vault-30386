import { isAddress } from 'viem';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';

export const validateEvmAddress = (address: string): boolean => {
  if (!address || address.length !== 42 || !address.startsWith('0x')) {
    toast.error('Invalid address format. Must be 42 characters starting with 0x');
    return false;
  }
  if (!isAddress(address)) {
    toast.error('Invalid Ethereum address checksum');
    return false;
  }
  return true;
};

export const validateSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    toast.error('Invalid Solana address format');
    return false;
  }
};
