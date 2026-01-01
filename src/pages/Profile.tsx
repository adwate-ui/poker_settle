import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, Database, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeName } from '@/config/themes';
import { toast } from 'sonner';
import { getCharacterImage } from '@/config/characterImages';
import { useChips } from '@/contexts/ChipContext';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

const GameSettingsTab = () => {
  const { chips, updateChipValue, resetDefaults } = useChips();
  const [localChips, setLocalChips] = useState(chips);

  useEffect(() => {
    setLocalChips(chips);
  }, [chips]);

  const handleValueChange = (color: string, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const numVal = parseInt(cleanVal);

    if (!isNaN(numVal)) {
      setLocalChips(prev => prev.map(c => c.color === color ? { ...c, value: numVal } : c));
    }
  };

  const handleBlur = (color: string, val: number) => {
    updateChipValue(color, val);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary" />
          <div>
            <CardTitle>Chip Values</CardTitle>
            <CardDescription>Customize the monetary value of each chip color.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {localChips.map((chip) => (
            <div key={chip.color} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center font-bold text-white bg-${chip.color === 'white' || chip.color === 'black' ? chip.color : chip.color + '-600'} border-2 border-white/20 ring-1 ring-border`}
                style={{ backgroundColor: chip.color === 'white' ? '#f3f4f6' : chip.color === 'black' ? '#1a1a1a' : undefined, color: chip.color === 'white' ? '#1f2937' : 'white' }}>
                {chip.label}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{chip.color} Chip</p>
                <p className="text-xs text-muted-foreground">Default: {chip.label}</p>
              </div>
              <div className="w-24">
                <Input
                  type="text"
                  value={chip.value}
                  onChange={(e) => handleValueChange(chip.color, e.target.value)}
                  onBlur={() => handleBlur(chip.color, chip.value)}
                  className="text-right font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentTheme, setTheme, loading: themeLoading } = useTheme();
  const [changingTheme, setChangingTheme] = useState(false);

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
            <TabsTrigger value="game-settings">
              <div className={`w-4 h-4 rounded-full mr-2 bg-primary/20 border-2 border-primary`} />
              Chips
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

          <TabsContent value="game-settings">
            <GameSettingsTab />
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

          <TabsContent value="storage">
            <CacheManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
