import { PuzzleGameComplete } from '@/components/PuzzleGameComplete';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PuzzleGame = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 p-4">
      <Button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30 hover:scale-105 transition-all shadow-lg hover:shadow-xl"
        size="sm"
      >
        <Home className="w-4 h-4 mr-2" />
        Home
      </Button>
      
      <div className="flex items-center justify-center min-h-screen">
        <PuzzleGameComplete />
      </div>
    </div>
  );
};

export default PuzzleGame;
