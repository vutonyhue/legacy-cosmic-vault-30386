import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

export const endpoint = clusterApiUrl('mainnet-beta');

export const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];
