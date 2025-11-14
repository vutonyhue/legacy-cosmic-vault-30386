import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetamaskHeader } from '@/components/wallet/MetamaskHeader';
import { MetamaskAssetsTab } from '@/components/wallet/MetamaskAssetsTab';
import { ReceiveTab } from '@/components/wallet/ReceiveTab';
import { SendTab } from '@/components/wallet/SendTab';
import { HistoryTab } from '@/components/wallet/HistoryTab';

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assets');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-md mx-auto py-4 sm:py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <img 
              src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
              alt="MetaMask" 
              className="w-8 h-8"
            />
            Web3 Wallet
          </h1>
        </div>
        
        <div className="space-y-4">
          <MetamaskHeader 
            onSendClick={() => setActiveTab('send')}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="assets">
              <MetamaskAssetsTab />
            </TabsContent>
            
            <TabsContent value="receive">
              <ReceiveTab />
            </TabsContent>
            
            <TabsContent value="send">
              <SendTab />
            </TabsContent>
            
            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <button 
              onClick={() => setActiveTab('receive')}
              className="p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors text-center"
            >
              <div className="text-2xl mb-1">📥</div>
              <p className="text-xs font-medium">Nhận</p>
            </button>
            <button 
              onClick={() => setActiveTab('send')}
              className="p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors text-center"
            >
              <div className="text-2xl mb-1">📤</div>
              <p className="text-xs font-medium">Gửi</p>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className="p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors text-center"
            >
              <div className="text-2xl mb-1">📜</div>
              <p className="text-xs font-medium">Lịch sử</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
