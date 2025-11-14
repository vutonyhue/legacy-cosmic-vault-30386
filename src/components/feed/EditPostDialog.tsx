import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Image, Video, X } from 'lucide-react';

interface EditPostDialogProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    video_url?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
}

export const EditPostDialog = ({ post, isOpen, onClose, onPostUpdated }: EditPostDialogProps) => {
  const [content, setContent] = useState(post.content);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url);
  const [videoPreview, setVideoPreview] = useState<string | null>(post.video_url);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setVideoFile(null);
      setVideoPreview(null);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video size must be less than 50MB');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !videoFile && !imagePreview && !videoPreview) {
      toast.error('Please add some content');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = imagePreview;
      let videoUrl = videoPreview;

      // Upload new image if selected
      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Upload new video if selected
      if (videoFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const fileExt = videoFile.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);
        videoUrl = publicUrl;
      }

      // Update post
      const { error } = await supabase
        .from('posts')
        .update({
          content,
          image_url: imageUrl,
          video_url: videoUrl,
        })
        .eq('id', post.id);

      if (error) throw error;

      toast.success('Post updated successfully');
      onPostUpdated();
      onClose();
    } catch (error: any) {
      toast.error('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />

          {imagePreview && !videoPreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {videoPreview && !imagePreview && (
            <div className="relative">
              <video src={videoPreview} controls className="w-full rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeVideo}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" asChild>
              <label>
                <Image className="w-4 h-4 mr-2" />
                {imagePreview ? 'Change Image' : 'Add Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </Button>
            <Button type="button" variant="outline" size="sm" className="flex-1" asChild>
              <label>
                <Video className="w-4 h-4 mr-2" />
                {videoPreview ? 'Change Video' : 'Add Video'}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
