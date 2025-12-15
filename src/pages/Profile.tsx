import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, Database, Palette, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeName } from '@/config/themes';
import { toast } from 'sonner';
import { getCharacterImage } from '@/config/characterImages';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentTheme, setTheme, loading: themeLoading } = useTheme();
  const [changingTheme, setChangingTheme] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    from_email: '',
    emailjs_service_id: '',
    emailjs_template_id: '',
    emailjs_public_key: '',
  });
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);
  const [loadingEmailConfig, setLoadingEmailConfig] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadEmailConfig = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('from_email, emailjs_service_id, emailjs_template_id, emailjs_public_key')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setEmailConfig({
            from_email: data.from_email || '',
            emailjs_service_id: data.emailjs_service_id || '',
            emailjs_template_id: data.emailjs_template_id || '',
            emailjs_public_key: data.emailjs_public_key || '',
          });
        }
      } catch (error) {
        console.error('Error loading email config:', error);
      } finally {
        setLoadingEmailConfig(false);
      }
    };

    loadEmailConfig();
  }, [user]);

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

  const handleSaveEmailConfig = async () => {
    if (!user) return;

    setSavingEmailConfig(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_configured: true,
          from_email: emailConfig.from_email || null,
          emailjs_service_id: emailConfig.emailjs_service_id || null,
          emailjs_template_id: emailConfig.emailjs_template_id || null,
          emailjs_public_key: emailConfig.emailjs_public_key || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Email configuration saved successfully!');
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error('Failed to save email configuration');
    } finally {
      setSavingEmailConfig(false);
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
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Theme
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

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Configure EmailJS for game notifications and settlements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEmailConfig ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-from-email">Your Email Address</Label>
                      <Input
                        id="profile-from-email"
                        type="email"
                        value={emailConfig.from_email}
                        onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-service-id">
                        EmailJS Service ID
                        <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="profile-service-id"
                        value={emailConfig.emailjs_service_id}
                        onChange={(e) => setEmailConfig({ ...emailConfig, emailjs_service_id: e.target.value })}
                        placeholder="service_xxxxxxx"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-template-id">
                        EmailJS Template ID
                        <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="profile-template-id"
                        value={emailConfig.emailjs_template_id}
                        onChange={(e) => setEmailConfig({ ...emailConfig, emailjs_template_id: e.target.value })}
                        placeholder="template_xxxxxxx"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-public-key">
                        EmailJS Public Key
                        <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="profile-public-key"
                        value={emailConfig.emailjs_public_key}
                        onChange={(e) => setEmailConfig({ ...emailConfig, emailjs_public_key: e.target.value })}
                        placeholder="Your public key"
                      />
                    </div>

                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                      <p className="mb-2">
                        <strong>How to get EmailJS credentials:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Create a free account at <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">emailjs.com</a></li>
                        <li>Create an email service (Gmail, Outlook, etc.)</li>
                        <li>Create an email template</li>
                        <li>Copy your Service ID, Template ID, and Public Key here</li>
                      </ol>
                      <p className="mt-2 text-xs">
                        Leave fields empty to use the default app configuration.
                      </p>
                    </div>

                    <Button 
                      onClick={handleSaveEmailConfig}
                      disabled={savingEmailConfig}
                      className="w-full"
                    >
                      {savingEmailConfig ? 'Saving...' : 'Save Email Configuration'}
                    </Button>
                  </div>
                )}
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

          <TabsContent value="storage">
            <CacheManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
