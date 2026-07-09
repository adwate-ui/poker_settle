import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, RefreshCw, HelpCircle, Sparkles, Info, Database, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useOnboarding, OnboardingWizard } from '@/components/feedback/OnboardingWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/feedback/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/notifications';
import { useChips } from '@/contexts/ChipContext';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currencyUtils";
import { CurrencyConfig } from "@/config/localization";

import { ProceduralChip } from '@/components/poker/ProceduralChip';
import { loadDemoData, clearDemoData, hasDemoData } from '@/lib/demoData';
import { useQueryClient } from '@tanstack/react-query';
import GameDefaultsTab from '@/components/profile/GameDefaultsTab';

const COLOR_MAP: Record<string, string> = {
  black: '#18181b',
  blue: '#1d4ed8',
  green: '#15803d',
  red: '#b91c1c',
  yellow: '#a16207',
  white: '#d4d4d8',
};

const GameSettingsTab = () => {
  const { chips, updateChipValue, resetDefaults } = useChips();
  const [localChips, setLocalChips] = useState(chips);

  useEffect(() => { setLocalChips(chips); }, [chips]);

  const handleValueChange = (color: string, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const numVal = parseInt(cleanVal);
    if (!isNaN(numVal) && numVal > 0) {
      setLocalChips(prev => prev.map(c => c.color === color ? { ...c, value: numVal } : c));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle>Chip Values</CardTitle>
        <CardDescription>Customize the monetary value of each chip color.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 md:p-6 pt-0 md:pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          {localChips.map((chip) => (
            <div key={chip.color} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <ProceduralChip
                  value=""
                  color={COLOR_MAP[chip.color] || chip.color}
                  size="md"
                  className="shadow-md"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{chip.color} Chip</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-sm text-muted-foreground font-medium">{CurrencyConfig.symbol}</span>
                <Input
                  type="text"
                  value={formatCurrency(chip.value, false)}
                  onChange={(e) => handleValueChange(chip.color, e.target.value)}
                  onBlur={() => updateChipValue(chip.color, chip.value)}
                  className="w-full sm:w-24 text-right tabular-nums h-12 md:h-10"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" size="sm" onClick={resetDefaults} className="h-12 md:h-10">
            <RefreshCw className="mr-2 h-4 w-4" /> Reset Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const HelpTab = () => {
  const { resetOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleReplayOnboarding = () => {
    resetOnboarding();
    setShowOnboarding(true);
  };

  return (
    <>
      {showOnboarding && <OnboardingWizard forceShow onComplete={() => setShowOnboarding(false)} />}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>Get help with using Poker Settle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 md:p-6 pt-0 md:pt-0">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">App Tutorial</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  New to Poker Settle? Replay the onboarding tutorial to learn about all the features.
                </p>
                <Button variant="outline" size="sm" onClick={handleReplayOnboarding} className="h-12 md:h-10">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Replay Tutorial
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-lg bg-state-info/10">
                <Info className="h-5 w-5 text-state-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">About Poker Settle</h3>
                <p className="text-sm text-muted-foreground">
                  Version 1.0.0 - Your premium poker game management companion.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Track buy-ins, calculate settlements, and keep everyone honest.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const AISettingsTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchKey = async () => {
      setLoading(true);
      const { data } = await supabase.from('user_api_keys').select('gemini_api_key').eq('user_id', user.id).maybeSingle();
      const apiKeyData = data as { gemini_api_key: string } | null;
      if (apiKeyData?.gemini_api_key) { setApiKey(apiKeyData.gemini_api_key); setIsSaved(true); }
      setLoading(false);
    };
    fetchKey();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('user_api_keys').upsert({ user_id: user.id, gemini_api_key: apiKey }, { onConflict: 'user_id' });
    setLoading(false);
    if (error) {
      toast.error("Failed to save API Key");
    } else {
      toast.success("API Key saved");
      setIsSaved(true);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>Configure settings for the AI Chip Scanner.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
        <div className="space-y-2">
          <label className="text-sm font-medium">Gemini API Key</label>
          <p className="text-sm text-muted-foreground">
            Used to read chip stacks from a photo during a game. Your key is stored privately and only sent to Google when you scan chips —{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">get a free key from Google AI Studio</a>.
          </p>
          <div className="flex gap-2">
            <Input type="password" value={isSaved ? "••••••••" : apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={isSaved || loading} className="flex-1 h-12 md:h-10" />
            {isSaved ? <Button variant="outline" onClick={() => { setApiKey(''); setIsSaved(false); }} className="h-12 md:h-10">Change</Button> :
              <Button onClick={handleSave} disabled={loading} className="h-12 md:h-10">{loading ? 'Saving...' : 'Save'}</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const DemoDataTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasDemo, setHasDemo] = useState(false);
  const [checkingDemo, setCheckingDemo] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const checkDemo = async () => {
      setCheckingDemo(true);
      const result = await hasDemoData(user.id);
      setHasDemo(result);
      setCheckingDemo(false);
    };
    checkDemo();
  }, [user]);

  const handleLoadDemo = async () => {
    if (!user) return;
    setIsLoading(true);
    const result = await loadDemoData(user.id);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      setHasDemo(true);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    } else {
      toast.error(result.message);
    }
  };

  const handleClearDemo = async () => {
    if (!user) return;
    setIsLoading(true);
    const result = await clearDemoData(user.id);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      setHasDemo(false);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle>Demo Data</CardTitle>
        <CardDescription>Load sample data to explore app features or showcase to others.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 md:p-6 pt-0 md:pt-0">
        {checkingDemo ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking for demo data...</span>
          </div>
        ) : hasDemo ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-state-success/10 border-state-success/20">
              <div className="p-2 rounded-lg bg-state-success/20">
                <Database className="h-5 w-5 text-state-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 text-state-success">Demo Data Loaded</h3>
                <p className="text-sm text-muted-foreground">
                  Your account has sample players and games. Explore the Games, Players, and Analytics tabs to see the app in action.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border bg-destructive/5 border-destructive/20">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Clear Demo Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Remove all demo players and their games. This won't affect any real data you've created.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearDemo}
                  disabled={isLoading}
                  className="h-12 md:h-10"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Clear Demo Data
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Try the App with Sample Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Load realistic demo data including 6 players and 6 completed games with settlements. Perfect for exploring features or demonstrating to others.
                </p>
                <Button
                  onClick={handleLoadDemo}
                  disabled={isLoading}
                  className="h-12 md:h-10"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  Load Demo Data
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>What's included:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>6 sample players with realistic names</li>
                <li>6 completed poker games over the past 5 months</li>
                <li>Various buy-in amounts (₹50, ₹100, ₹200)</li>
                <li>Settlements and payment statuses</li>
                <li>Full analytics and history data</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ atStart: true, atEnd: true });

  const updateScrollEdges = useCallback(() => {
    const el = tabsListRef.current;
    if (!el) return;
    setScrollEdges({
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);
  useEffect(() => { updateScrollEdges(); }, [updateScrollEdges]);

  if (loading || !user) return <div className="p-8 space-y-6"><Skeleton className="h-12 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const profileDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="container max-w-4xl py-6 px-4 md:py-8 md:px-0 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="ml-0 md:-ml-4 text-muted-foreground hover:text-foreground h-12 md:h-10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="relative">
          <TabsList
            ref={tabsListRef}
            onScroll={updateScrollEdges}
            className="flex w-full overflow-x-auto justify-start md:grid md:grid-cols-7 h-auto p-1 bg-muted/20"
          >
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="game-settings">Chips</TabsTrigger>
            <TabsTrigger value="game">Game</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          <div className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-md bg-gradient-to-r from-muted/60 to-transparent transition-opacity duration-200 md:hidden",
            scrollEdges.atStart ? "opacity-0" : "opacity-100"
          )} />
          <div className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-md bg-gradient-to-l from-muted/60 to-transparent transition-opacity duration-200 md:hidden",
            scrollEdges.atEnd ? "opacity-0" : "opacity-100"
          )} />
        </div>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={profileDisplayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-luxury">
                    {profileDisplayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profileDisplayName}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
              <div className="pt-4 border-t border-border"><label className="text-sm font-medium text-muted-foreground">Member Since</label><p className="text-sm text-foreground">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              <div><label className="text-sm font-medium text-muted-foreground">User ID</label><p className="text-sm font-mono text-muted-foreground">{user.id}</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="game-settings"><GameSettingsTab /></TabsContent>
        <TabsContent value="game"><GameDefaultsTab /></TabsContent>
        <TabsContent value="ai"><AISettingsTab /></TabsContent>
        <TabsContent value="demo"><DemoDataTab /></TabsContent>
        <TabsContent value="storage"><CacheManager /></TabsContent>
        <TabsContent value="help"><HelpTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
