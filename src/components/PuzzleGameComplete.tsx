import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Shuffle } from 'lucide-react';
import { toast } from 'sonner';

// ===== GameStats Component =====
interface GameStatsProps {
  moves: number;
  time: number;
}

const GameStats = ({ moves, time }: GameStatsProps) => {
  return (
    <div className="flex gap-6 justify-center mb-6">
      <div className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
        <div className="text-sm text-white/80 font-medium">Moves</div>
        <div className="text-2xl font-bold text-white">{moves}</div>
      </div>
      <div className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
        <div className="text-sm text-white/80 font-medium">Time</div>
        <div className="text-2xl font-bold text-white">{time}s</div>
      </div>
    </div>
  );
};

// ===== PuzzleTile Component =====
interface PuzzleTileProps {
  value: number;
  isEmpty: boolean;
  onClick: () => void;
}

const PuzzleTile = ({ value, isEmpty, onClick }: PuzzleTileProps) => {
  if (isEmpty) {
    return (
      <div className="aspect-square rounded-xl bg-black/20 backdrop-blur-sm border border-white/10" />
    );
  }

  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm 
        border-2 border-white/40 shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.6)]
        hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer
        relative overflow-hidden group animate-float"
      style={{
        transform: 'perspective(1000px) rotateX(2deg) rotateY(2deg)',
        animationDelay: `${value * 0.1}s`
      }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent 
        -translate-x-full group-hover:translate-x-full transition-transform duration-1000 animate-shimmer" />
      
      {/* Glow border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-orange-400/50 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
      
      {/* Number */}
      <span className="relative z-10 text-4xl font-bold bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 
        bg-clip-text text-transparent drop-shadow-lg">
        {value}
      </span>
    </button>
  );
};

// ===== PuzzleGrid Component (Main) =====
export const PuzzleGameComplete = () => {
  const [tiles, setTiles] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const shuffleTiles = () => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setTiles(shuffled);
    setMoves(0);
    setTime(0);
    setIsPlaying(true);
  };

  const checkWin = (currentTiles: number[]) => {
    return currentTiles.every((tile, index) => 
      index === currentTiles.length - 1 ? tile === 0 : tile === index + 1
    );
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying) return;

    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    const isAdjacent = 
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(prev => prev + 1);

      if (checkWin(newTiles)) {
        setIsPlaying(false);
        toast.success(`🎉 You won in ${moves + 1} moves and ${time}s!`);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-5xl font-bold text-white text-center mb-8 drop-shadow-2xl animate-float"
        style={{ 
          textShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4)',
          animation: 'float 3s ease-in-out infinite'
        }}>
        3D Puzzle Game
      </h1>

      <GameStats moves={moves} time={time} />

      <div className="grid grid-cols-3 gap-3 mb-6 p-6 rounded-2xl bg-white/10 backdrop-blur-lg 
        border-2 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.3)] relative"
        style={{ 
          transform: 'perspective(1000px) rotateX(5deg)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 100px rgba(255,255,255,0.2), inset 0 0 60px rgba(255,255,255,0.1)'
        }}>
        {tiles.map((tile, index) => (
          <PuzzleTile
            key={index}
            value={tile}
            isEmpty={tile === 0}
            onClick={() => handleTileClick(index)}
          />
        ))}
      </div>

      <Button
        onClick={shuffleTiles}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 
          hover:from-purple-700 hover:via-pink-700 hover:to-orange-700
          text-white font-bold text-lg shadow-2xl hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]
          transition-all duration-300 hover:scale-105 active:scale-95
          border-2 border-white/30 backdrop-blur-sm"
      >
        <Shuffle className="mr-2 h-5 w-5" />
        Shuffle
      </Button>
    </div>
  );
};
