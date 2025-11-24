import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { config } from './config/web3';
import { endpoint, wallets } from './config/solana';
import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';

import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";
import PuzzleGame from "./pages/PuzzleGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WagmiProvider config={config}>
            <RainbowKitProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Feed />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/puzzle" element={<PuzzleGame />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </QueryClientProvider>
);

export default App;
