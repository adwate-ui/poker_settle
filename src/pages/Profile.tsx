import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, Database, Palette, Spade } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeName } from '@/config/themes';
import { toast } from 'sonner';
import { getCharacterImage } from '@/config/characterImages';
import { useCardBackDesign, CardBackDesign } from '@/hooks/useCardBackDesign';
import { CardBackSVG } from '@/components/PokerAssets';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentTheme, setTheme, loading: themeLoading } = useTheme();
  const { design: cardBackDesign, setDesign: setCardBackDesign, loading: cardBackLoading } = useCardBackDesign();
  const [changingTheme, setChangingTheme] = useState(false);
  const [changingCardBack, setChangingCardBack] = useState(false);

  const cardBackDesigns: Array<{ id: CardBackDesign; name: string; description: string }> = [
    { id: 'classic', name: 'Classic Green', description: 'Traditional poker table green with gold accents' },
    { id: 'geometric', name: 'Geometric Blue', description: 'Modern sharp angles in royal blue' },
    { id: 'diamond', name: 'Diamond Lattice', description: 'Elegant purple diamond pattern' },
    { id: 'hexagon', name: 'Hexagon Teal', description: 'Contemporary hexagonal design in teal' },
    { id: 'wave', name: 'Wave Crimson', description: 'Flowing wave pattern in deep red' },
    { id: 'radial', name: 'Radial Orange', description: 'Radiating lines in vibrant orange' },
  ];

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="cardback">
              <Spade className="h-4 w-4 mr-2" />
              Card Back
            </TabsTrigger>
            <TabsTrigger value="storage">
              <Database className="h-4 w-4 mr-2" />
              Storage
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

          <TabsContent value="cardback">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Spade className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Card Back Design</CardTitle>
                    <CardDescription>Choose a card back design for your poker cards</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cardBackLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cardBackDesigns.map((designOption) => {
                      const isActive = cardBackDesign === designOption.id;
                      return (
                        <button
                          key={designOption.id}
                          onClick={() => handleCardBackChange(designOption.id)}
                          disabled={changingCardBack || isActive}
                          className={`
                            p-4 rounded-lg border-2 text-left transition-all
                            ${isActive 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 hover:bg-accent'
                            }
                            ${changingCardBack ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center">
                              <CardBackSVG width={78} height={112} design={designOption.id} />
                            </div>
                            <div className="text-center w-full">
                              <h3 className="font-semibold text-base">{designOption.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {designOption.description}
                              </p>
                              {isActive && (
                                <div className="mt-2 text-xs text-primary font-medium">
                                  ✓ Active
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage">
            <CacheManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
