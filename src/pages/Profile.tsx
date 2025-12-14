import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, Database, Palette, Mail, CreditCard, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeName } from '@/config/themes';
import { toast } from 'sonner';
import { getCharacterImage } from '@/config/characterImages';
import { EmailSettings } from '@/components/EmailSettings';
import { PaymentSettings } from '@/components/PaymentSettings';
import { FirstTimeTutorial } from '@/components/FirstTimeTutorial';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentTheme, setTheme, loading: themeLoading } = useTheme();
  const [changingTheme, setChangingTheme] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleThemeChange = async (themeName: ThemeName) => {
    setChangingTheme(true);
    try {
      await setTheme(themeName);
      toast.success(`Theme changed to ${themes[themeName].displayName}`);
    } catch (error) {
      toast.error('Failed to change theme');
      console.error('Error changing theme:', error);
    } finally {
      setChangingTheme(false);
    }
  };

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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="tutorial">
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Tutorial</span>
            </TabsTrigger>
            <TabsTrigger value="storage">
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
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
          </TabsContent>

          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Palette className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Theme Selection</CardTitle>
                    <CardDescription>Choose an anime theme to customize colors and player icons</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {themeLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {Object.entries(themes).map(([key, theme]) => {
                      const isActive = currentTheme === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleThemeChange(key as ThemeName)}
                          disabled={changingTheme || isActive}
                          className={`
                            p-4 rounded-lg border-2 text-left transition-all
                            ${isActive 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 hover:bg-accent'
                            }
                            ${changingTheme ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg">{theme.displayName}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {theme.description}
                              </p>
                              {theme.characters.length > 0 && (
                                <>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {theme.characters.length} characters available
                                  </p>
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {theme.characters.slice(0, 6).map((charName) => {
                                      const charImage = getCharacterImage(charName);
                                      return charImage ? (
                                        <img
                                          key={charName}
                                          src={charImage}
                                          alt={charName}
                                          title={charName}
                                          className="w-8 h-8 rounded-full object-cover border-2 border-border"
                                          onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : null;
                                    })}
                                    {theme.characters.length > 6 && (
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-border">
                                        +{theme.characters.length - 6}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            {isActive && (
                              <div className="flex items-center gap-2 text-primary flex-shrink-0 self-start">
                                <span className="text-sm font-medium whitespace-nowrap">Active</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <EmailSettings />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentSettings />
          </TabsContent>

          <TabsContent value="tutorial">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Tutorial</CardTitle>
                    <CardDescription>Learn how to use Poker Settle</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  New to Poker Settle? Run through our interactive tutorial to learn how to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Add players and create games</li>
                  <li>Track buy-ins and stacks</li>
                  <li>Record poker hands</li>
                  <li>Send settlement notifications</li>
                  <li>Configure email and payment settings</li>
                </ul>
                <Button 
                  onClick={() => setShowTutorial(true)}
                  className="mt-4"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Tutorial
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage">
            <CacheManager />
          </TabsContent>
        </Tabs>

        <FirstTimeTutorial
          open={showTutorial}
          onClose={() => setShowTutorial(false)}
        />
      </div>
    </div>
  );
};

export default Profile;
