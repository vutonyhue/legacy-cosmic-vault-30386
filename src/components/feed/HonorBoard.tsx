import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, MessageCircle, Star, Users, BadgeDollarSign } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string;
  posts_count: number;
  comments_count: number;
  reactions_count: number;
  friends_count: number;
  total_reward: number;
}

export const HonorBoard = () => {
  const navigate = useNavigate();
  const [topPosts, setTopPosts] = useState<LeaderboardUser[]>([]);
  const [topComments, setTopComments] = useState<LeaderboardUser[]>([]);
  const [topReactions, setTopReactions] = useState<LeaderboardUser[]>([]);
  const [topFriends, setTopFriends] = useState<LeaderboardUser[]>([]);
  const [topRewards, setTopRewards] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Fetch top users by posts count
      const { data: postsData } = await supabase
        .from('posts')
        .select('user_id, profiles!inner(id, username, avatar_url)')
        .order('created_at', { ascending: false });

      // Fetch top users by comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('user_id, profiles!inner(id, username, avatar_url)')
        .order('created_at', { ascending: false });

      // Fetch top users by reactions count
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('user_id, profiles!inner(id, username, avatar_url)')
        .order('created_at', { ascending: false });

      // Aggregate posts data
      const postsMap = new Map<string, LeaderboardUser>();
      postsData?.forEach((post: any) => {
        const profile = post.profiles;
        if (profile) {
          const existing = postsMap.get(profile.id) || {
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            posts_count: 0,
            comments_count: 0,
            reactions_count: 0,
            friends_count: 0,
            total_reward: 0,
          };
          existing.posts_count++;
          postsMap.set(profile.id, existing);
        }
      });

      // Aggregate comments data
      const commentsMap = new Map<string, LeaderboardUser>();
      commentsData?.forEach((comment: any) => {
        const profile = comment.profiles;
        if (profile) {
          const existing = commentsMap.get(profile.id) || {
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            posts_count: 0,
            comments_count: 0,
            reactions_count: 0,
            friends_count: 0,
            total_reward: 0,
          };
          existing.comments_count++;
          commentsMap.set(profile.id, existing);
        }
      });

      // Aggregate reactions data
      const reactionsMap = new Map<string, LeaderboardUser>();
      reactionsData?.forEach((reaction: any) => {
        const profile = reaction.profiles;
        if (profile) {
          const existing = reactionsMap.get(profile.id) || {
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            posts_count: 0,
            comments_count: 0,
            reactions_count: 0,
            friends_count: 0,
            total_reward: 0,
          };
          existing.reactions_count++;
          reactionsMap.set(profile.id, existing);
        }
      });

      // Convert to arrays and sort
      const topPostsUsers = Array.from(postsMap.values())
        .sort((a, b) => b.posts_count - a.posts_count)
        .slice(0, 5);
      
      const topCommentsUsers = Array.from(commentsMap.values())
        .sort((a, b) => b.comments_count - a.comments_count)
        .slice(0, 5);
      
      const topReactionsUsers = Array.from(reactionsMap.values())
        .sort((a, b) => b.reactions_count - a.reactions_count)
        .slice(0, 5);

      setTopPosts(topPostsUsers);
      setTopComments(topCommentsUsers);
      setTopReactions(topReactionsUsers);
      
      // For now, Friends and Rewards are placeholders (future implementation)
      setTopFriends([]);
      setTopRewards([]);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const StatRow = ({ icon, label, value, user }: { icon: React.ReactNode; label: string; value: number; user?: LeaderboardUser }) => (
    <div 
      onClick={() => user && handleUserClick(user.id)}
      className="relative border-2 border-yellow-500 rounded-xl p-4 bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm hover:from-green-700/60 hover:to-green-600/60 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-yellow-400">
            {icon}
          </div>
          <span className="text-yellow-400 font-bold text-lg uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-white font-bold text-2xl">{value.toLocaleString()}</span>
      </div>
      {user && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-yellow-500/30">
          <Avatar className="w-6 h-6 border-2 border-yellow-400/50">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-xs bg-yellow-500 text-black">
              {user.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-yellow-200 text-sm font-medium">{user.username}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative rounded-3xl overflow-hidden border-4 border-yellow-500 bg-gradient-to-br from-green-600 via-green-700 to-green-800 shadow-2xl">
      {/* Sparkle effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-12 left-12 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-8 right-16 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative p-6 space-y-4">
        {/* Header with logo */}
        <div className="text-center space-y-2">
          <div className="inline-block">
            <div className="relative">
              <img 
                src="/fun-profile-logo.jpg" 
                alt="Fun Profile Web3"
                className="w-20 h-20 mx-auto rounded-full border-2 border-yellow-400 shadow-lg"
              />
            </div>
          </div>
          
          {/* User info (only show on profile page) */}
          {topPosts[0] && (
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-white text-2xl font-bold tracking-wide">{topPosts[0].username.toUpperCase()}</h2>
              <Avatar className="w-12 h-12 border-3 border-yellow-400">
                <AvatarImage src={topPosts[0].avatar_url} />
                <AvatarFallback className="bg-yellow-500 text-black font-bold">
                  {topPosts[0].username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <h1 className="text-yellow-400 text-4xl font-black tracking-wider drop-shadow-lg">
            HONOR BOARD
          </h1>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <StatRow 
            icon={<ArrowUp className="w-6 h-6" />}
            label="POSTS"
            value={topPosts[0]?.posts_count || 0}
            user={topPosts[0]}
          />
          <StatRow 
            icon={<MessageCircle className="w-6 h-6" />}
            label="COMMENTS"
            value={topComments[0]?.comments_count || 0}
            user={topComments[0]}
          />
          <StatRow 
            icon={<Star className="w-6 h-6" />}
            label="REACTIONS"
            value={topReactions[0]?.reactions_count || 0}
            user={topReactions[0]}
          />
          <StatRow 
            icon={<Users className="w-6 h-6" />}
            label="FRIENDS"
            value={topFriends[0]?.friends_count || 0}
            user={topFriends[0]}
          />
          <StatRow 
            icon={<BadgeDollarSign className="w-6 h-6" />}
            label="TOTAL REWARD"
            value={topRewards[0]?.total_reward || 0}
            user={topRewards[0]}
          />
        </div>
      </div>
    </div>
  );
};
