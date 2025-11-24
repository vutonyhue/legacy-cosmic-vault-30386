import { PuzzleGameComplete } from '@/components/PuzzleGameComplete';

const PuzzleGame = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 flex items-center justify-center p-4">
      <PuzzleGameComplete />
    </div>
  );
};

export default PuzzleGame;
