import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Trash2, Share2, MessageCircle, Repeat2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { CommentSection } from './CommentSection';
import { ImageViewer } from './ImageViewer';
import { EditPostDialog } from './EditPostDialog';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    video_url?: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
    reactions: { id: string; user_id: string }[];
    comments: any[];
  };
  currentUserId: string;
  onPostDeleted: () => void;
}

export const PostCard = ({ post, currentUserId, onPostDeleted }: PostCardProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(
    post.reactions.some((r) => r.user_id === currentUserId)
  );
  const [likeCount, setLikeCount] = useState(post.reactions.length);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments.length);
  const [showComments, setShowComments] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleLike = async () => {
    try {
      if (liked) {
        const reaction = post.reactions.find((r) => r.user_id === currentUserId);
        if (reaction) {
          await supabase.from('reactions').delete().eq('id', reaction.id);
          setLiked(false);
          setLikeCount((prev) => prev - 1);
        }
      } else {
        await supabase.from('reactions').insert({
          post_id: post.id,
          user_id: currentUserId,
        });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error: any) {
      toast.error('Failed to update reaction');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      toast.success('Post deleted');
      onPostDeleted();
    } catch (error: any) {
      toast.error('Failed to delete post');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleRepost = async () => {
    try {
      const { error } = await supabase.from('shared_posts').insert({
        user_id: currentUserId,
        original_post_id: post.id,
      });

      if (error) throw error;
      toast.success('Post shared to your profile!');
    } catch (error: any) {
      toast.error('Failed to share post');
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.user_id}`);
  };

  return (
    <>
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-6">
          <Avatar className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10" onClick={handleProfileClick}>
            {post.profiles.avatar_url && <AvatarImage src={post.profiles.avatar_url} />}
            <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold cursor-pointer hover:underline text-sm sm:text-base truncate" 
              onClick={handleProfileClick}
            >
              {post.profiles.username}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {post.content && <p className="whitespace-pre-wrap text-sm sm:text-base break-words">{post.content}</p>}
          
          {post.image_url && (
            <>
              <img
                src={post.image_url}
                alt="Post"
                className="w-full max-w-[1920px] max-h-[1920px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain mx-auto"
                onClick={() => setShowImageViewer(true)}
              />
              <ImageViewer
                imageUrl={post.image_url}
                isOpen={showImageViewer}
                onClose={() => setShowImageViewer(false)}
              />
            </>
          )}

          {post.video_url && (
            <video
              controls
              className="w-full max-w-[1920px] rounded-lg mx-auto"
              src={post.video_url}
            >
              Your browser does not support video playback.
            </video>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`${liked ? 'text-destructive' : ''} text-xs sm:text-sm`}
            >
              <Heart className={`w-4 h-4 mr-1 sm:mr-2 ${liked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{likeCount}</span>
              <span className="sm:hidden">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-xs sm:text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{commentCount}</span>
              <span className="sm:hidden">{commentCount}</span>
            </Button>
            {post.user_id !== currentUserId && (
              <Button variant="ghost" size="sm" onClick={handleRepost} className="text-xs sm:text-sm">
                <Repeat2 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-xs sm:text-sm">
              <Share2 className="w-4 h-4" />
            </Button>
            {post.user_id === currentUserId && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)} className="text-xs sm:text-sm">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-xs sm:text-sm ml-auto">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          {showComments && (
            <CommentSection postId={post.id} onCommentAdded={() => setCommentCount(prev => prev + 1)} />
          )}
        </CardFooter>
      </Card>
      
      <EditPostDialog
        post={post}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onPostUpdated={onPostDeleted}
      />
    </>
  );
};
