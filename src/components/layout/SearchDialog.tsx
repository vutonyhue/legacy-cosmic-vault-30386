import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export const SearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search with debounced query
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim().length < 3) {
        setProfiles([]);
        setPosts([]);
        return;
      }

      setLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Log search for rate limiting
        if (user) {
          await supabase.from('search_logs').insert({
            user_id: user.id,
            search_query: debouncedQuery
          });
        }

        // Search profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`)
          .limit(10);

        // Search posts
        const { data: postData } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            profiles (username, avatar_url)
          `)
          .ilike('content', `%${debouncedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        setProfiles(profileData || []);
        setPosts(postData as any || []);
      } catch (error: any) {
        if (error.message?.includes('Rate limit exceeded')) {
          console.error('Search rate limit exceeded');
        }
        setProfiles([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleProfileClick = (userId: string) => {
    setOpen(false);
    navigate(`/profile/${userId}`);
    setSearchQuery('');
  };

  const handlePostClick = () => {
    setOpen(false);
    navigate('/');
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
          <Search className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tìm kiếm</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Tìm kiếm người dùng hoặc bài viết... (tối thiểu 3 ký tự)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />

          {searchQuery.trim().length >= 3 && (
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">
                  Người dùng ({profiles.length})
                </TabsTrigger>
                <TabsTrigger value="posts">
                  Bài viết ({posts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Đang tìm kiếm...
                    </div>
                  ) : profiles.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào
                    </div>
                  ) : (
                    profiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleProfileClick(profile.id)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Avatar className="w-12 h-12">
                          {profile.avatar_url && (
                            <AvatarImage src={profile.avatar_url} />
                          )}
                          <AvatarFallback>
                            {profile.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="font-semibold">{profile.username}</p>
                          {profile.full_name && (
                            <p className="text-sm text-muted-foreground">
                              {profile.full_name}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="posts">
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Đang tìm kiếm...
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Không tìm thấy bài viết nào
                    </div>
                  ) : (
                    posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={handlePostClick}
                        className="w-full p-4 flex items-start gap-3 hover:bg-muted rounded-lg transition-colors border-b"
                      >
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          {post.profiles?.avatar_url && (
                            <AvatarImage src={post.profiles.avatar_url} />
                          )}
                          <AvatarFallback>
                            {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {post.profiles?.username}
                          </p>
                          <p className="text-sm text-foreground line-clamp-2 mt-1">
                            {post.content}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
