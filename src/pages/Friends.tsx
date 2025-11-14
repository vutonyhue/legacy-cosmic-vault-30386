import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Friends = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(session.user.id);
      fetchFriends(session.user.id);
      fetchRequests(session.user.id);
      fetchSent(session.user.id);
      fetchSuggestions(session.user.id);
    };
    checkAuth();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        if (currentUserId) {
          fetchFriends(currentUserId);
          fetchRequests(currentUserId);
          fetchSent(currentUserId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, currentUserId]);

  const fetchFriends = async (userId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:profiles!friendships_requester_id_fkey(*),
        addressee:profiles!friendships_addressee_id_fkey(*)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    const friendsList = data?.map(f => {
      const friend = f.requester_id === userId ? f.addressee : f.requester;
      return { 
        id: friend?.id,
        username: friend?.username,
        display_name: friend?.display_name,
        avatar_url: friend?.avatar_url,
        friendshipId: f.id 
      };
    }) || [];
    setFriends(friendsList);
  };

  const fetchRequests = async (userId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select(`*, requester:profiles!friendships_requester_id_fkey(*)`)
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    setRequests(data || []);
  };

  const fetchSent = async (userId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select(`*, addressee:profiles!friendships_addressee_id_fkey(*)`)
      .eq('requester_id', userId)
      .eq('status', 'pending');
    setSent(data || []);
  };

  const fetchSuggestions = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(10);
    setSuggestions(data || []);
  };

  const sendFriendRequest = async (addresseeId: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: addresseeId });

    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể gửi lời mời kết bạn', variant: 'destructive' });
    } else {
      toast({ title: 'Đã gửi', description: 'Lời mời kết bạn đã được gửi' });
      fetchSent(currentUserId);
      fetchSuggestions(currentUserId);
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) {
      toast({ title: 'Đã chấp nhận', description: 'Bạn đã chấp nhận lời mời kết bạn' });
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      toast({ title: 'Đã từ chối', description: 'Bạn đã từ chối lời mời kết bạn' });
    }
  };

  const unfriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      toast({ title: 'Đã xóa', description: 'Bạn đã xóa kết bạn' });
    }
  };

  const startChat = async (friendId: string) => {
    // Create or find existing conversation
    const { data: existingConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (existingConvs) {
      for (const conv of existingConvs) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id);

        if (participants?.length === 2 && participants.some(p => p.user_id === friendId)) {
          navigate(`/messages?conversation=${conv.conversation_id}`);
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (newConv) {
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: friendId }
      ]);
      navigate(`/messages?conversation=${newConv.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-8 px-4">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Bạn bè ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="w-4 h-4 mr-2" />
              Lời mời ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <UserCheck className="w-4 h-4 mr-2" />
              Gợi ý
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 mt-6">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Chưa có bạn bè
                </CardContent>
              </Card>
            ) : (
              friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        {friend.avatar_url && <AvatarImage src={friend.avatar_url} />}
                        <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{friend.username}</p>
                        <p className="text-sm text-muted-foreground">{friend.display_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => startChat(friend.id)}>Nhắn tin</Button>
                      <Button variant="outline" onClick={() => unfriend(friend.friendshipId)}>
                        Hủy kết bạn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Không có lời mời kết bạn
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        {request.requester.avatar_url && <AvatarImage src={request.requester.avatar_url} />}
                        <AvatarFallback>{request.requester.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{request.requester.username}</p>
                        <p className="text-sm text-muted-foreground">{request.requester.display_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => acceptRequest(request.id)}>Chấp nhận</Button>
                      <Button variant="outline" onClick={() => rejectRequest(request.id)}>
                        Từ chối
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4 mt-6">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Không có gợi ý
                </CardContent>
              </Card>
            ) : (
              suggestions.map((user) => (
                <Card key={user.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.display_name}</p>
                      </div>
                    </div>
                    <Button onClick={() => sendFriendRequest(user.id)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Kết bạn
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Friends;
