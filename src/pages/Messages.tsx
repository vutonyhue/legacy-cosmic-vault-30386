import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Messages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(session.user.id);
      fetchConversations(session.user.id);

      const conversationId = searchParams.get('conversation');
      if (conversationId) {
        setSelectedConversation(conversationId);
        fetchMessages(conversationId);
      }
    };
    checkAuth();
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!selectedConversation) return;

    fetchMessages(selectedConversation);

    const channel = supabase
      .channel(`messages-${selectedConversation}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations) return;

    const convIds = participations.map(p => p.conversation_id);
    const conversationsData = [];

    for (const convId of convIds) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(*)')
        .eq('conversation_id', convId)
        .neq('user_id', userId);

      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (participants && participants.length > 0) {
        conversationsData.push({
          id: convId,
          otherUser: participants[0].profiles,
          lastMessage
        });
      }
    }

    setConversations(conversationsData);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
      fetchConversations(currentUserId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-6xl py-4 px-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Conversations List */}
          <div className="col-span-12 md:col-span-4">
            <Card className="h-full">
              <CardContent className="p-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Tin nhắn
                </h2>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  {conversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Chưa có cuộc trò chuyện
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}
                        >
                          <Avatar className="w-12 h-12">
                            {conv.otherUser.avatar_url && <AvatarImage src={conv.otherUser.avatar_url} />}
                            <AvatarFallback>{conv.otherUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{conv.otherUser.username}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Messages Area */}
          <div className="col-span-12 md:col-span-8">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender_id === currentUserId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: vi
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1"
                      />
                      <Button onClick={sendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
