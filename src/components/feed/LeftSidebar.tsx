import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, Users, Sparkles } from 'lucide-react';

export const LeftSidebar = () => {
  return (
    <div className="space-y-4">
      {/* About Section */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Về Camly Fun
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Mạng xã hội kết nối cộng đồng crypto và blockchain.</p>
          <p className="text-xs">Chia sẻ, tương tác và kiếm thưởng mỗi ngày!</p>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Xu Hướng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <p className="text-sm font-medium">#CryptoCommunity</p>
            <p className="text-xs text-muted-foreground">245 bài viết</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <p className="text-sm font-medium">#Blockchain</p>
            <p className="text-xs text-muted-foreground">189 bài viết</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <p className="text-sm font-medium">#Web3</p>
            <p className="text-xs text-muted-foreground">156 bài viết</p>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Friends */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Gợi Ý Kết Bạn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Đăng nhập để xem gợi ý kết bạn</p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tính Năng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
            <p>Ví crypto tích hợp</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
            <p>Kiếm Camly Coin mỗi ngày</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
            <p>Kết nối cộng đồng Web3</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
