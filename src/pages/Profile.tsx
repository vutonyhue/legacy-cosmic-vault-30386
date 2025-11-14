import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditProfile } from '@/components/profile/EditProfile';
import { PostCard } from '@/components/feed/PostCard';

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setCurrentUserId(session.user.id);
      }
      
      // If userId param exists, view that profile (anyone can view)
      // If no userId param, show own profile if logged in, otherwise redirect to auth
      let profileId = userId;
      if (!userId) {
        if (session) {
          profileId = session.user.id;
        } else {
          navigate('/auth');
          return;
        }
      }
      
      setIsOwnProfile(session ? profileId === session.user.id : false);
      fetchProfile(profileId);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUserId(session.user.id);
        // Update isOwnProfile when auth state changes
        if (userId) {
          setIsOwnProfile(session.user.id === userId);
        }
      } else {
        setCurrentUserId('');
        setIsOwnProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, userId]);

  const fetchProfile = async (profileId: string) => {
    try {
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch user posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url),
          reactions (id, user_id),
          comments (id)
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = () => {
    const profileId = userId || currentUserId;
    if (profileId) {
      fetchProfile(profileId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-4 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <Card className="overflow-hidden">
            {profile?.cover_url && (
              <div className="w-full h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary-glow/20">
                <img 
                  src={profile.cover_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!profile?.cover_url && (
              <div className="w-full h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary-glow/20" />
            )}
            <CardHeader className="text-center p-4 sm:p-6 relative">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto -mt-12 sm:-mt-16 mb-3 sm:mb-4 border-4 border-background">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="text-2xl sm:text-3xl">
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl sm:text-2xl">{profile?.username}</CardTitle>
              <p className="text-sm sm:text-base text-muted-foreground">{profile?.full_name || 'Chưa đặt tên'}</p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <p className="text-center text-sm sm:text-base break-words">{profile?.bio || 'Chưa có tiểu sử'}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-2' : 'grid-cols-1'} h-auto`}>
            <TabsTrigger value="posts" className="text-xs sm:text-sm py-2">{isOwnProfile ? 'My Posts' : 'Posts'}</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="edit" className="text-xs sm:text-sm py-2">Edit Profile</TabsTrigger>}
          </TabsList>
          <TabsContent value="posts" className="space-y-4 mt-6">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No posts yet
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}
          </TabsContent>
          {isOwnProfile && (
            <TabsContent value="edit" className="mt-6">
              <EditProfile />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
