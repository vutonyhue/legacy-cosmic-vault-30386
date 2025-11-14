import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { AvatarCropper } from './AvatarCropper';

export const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUsername(data.username || '');
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
      setCoverUrl(data.cover_url || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Validate file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('File quá lớn! Vui lòng chọn file dưới 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Error loading image');
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setUploading(true);
      setCropImage(null);

      if (!userId) throw new Error('No user found');

      const fileExt = 'jpg';
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImageBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Validate file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('File quá lớn! Vui lòng chọn file dưới 5MB');
        return;
      }

      setUploadingCover(true);

      if (!userId) throw new Error('No user found');

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setCoverUrl(publicUrl);
      toast.success('Ảnh bìa đã được cập nhật!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Lỗi khi tải ảnh bìa');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!userId) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          bio,
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {cropImage && (
        <AvatarCropper
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      )}
      <Card className="overflow-hidden">
        <div className="relative">
          {coverUrl && (
            <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-primary-glow/20">
              <img 
                src={coverUrl} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!coverUrl && (
            <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-primary-glow/20" />
          )}
          <div className="absolute top-4 right-4">
            <Label htmlFor="cover" className="cursor-pointer">
              <Button type="button" variant="secondary" size="sm" disabled={uploadingCover} asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
                </span>
              </Button>
            </Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
              disabled={uploadingCover}
            />
          </div>
        </div>
        <CardHeader>
          <CardTitle>Chỉnh sửa hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32 -mt-20 border-4 border-background">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-4xl">
                  {username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <Button type="button" variant="outline" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Đang tải...' : 'Tải ảnh đại diện'}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Tên người dùng</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên người dùng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Tiểu sử</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 120))}
                placeholder="Giới thiệu về bạn (tối đa 120 ký tự)"
                rows={4}
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">{bio.length}/120 ký tự</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
