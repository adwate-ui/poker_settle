import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useShareToken } from '@/hooks/useShareToken';
import { ArrowLeft, Copy, RefreshCw, Share2, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    shareToken,
    loading: tokenLoading,
    createShareToken,
    regenerateShareToken,
    getShareUrl,
    copyShareUrl,
  } = useShareToken();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || tokenLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const shareUrl = shareToken ? getShareUrl(shareToken.token) : '';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Share2 className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Share Link Management</CardTitle>
                  <CardDescription>
                    Create a shareable link for read-only access to your games and players data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!shareToken ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      You haven't created a share link yet. Create one to share your poker data with others.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={createShareToken} className="w-full sm:w-auto">
                    <Share2 className="mr-2 h-4 w-4" />
                    Create Share Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Your Share Link
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button onClick={copyShareUrl} variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Anyone with this link can view your games and players data without signing in.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={copyShareUrl} variant="outline" className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button onClick={regenerateShareToken} variant="destructive" className="flex-1">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Link
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Regenerating the link will invalidate the old link. Anyone using the old link will lose access.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
