import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User, Database, Bot, Eye, Key } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useChips } from '@/contexts/ChipContext';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatIndianNumber, cn } from "@/lib/utils";
import LuxuryLayout from '../components/layout/LuxuryLayout';

const GameSettingsTab = () => {
  // ... existing GameSettingsTab content ...
  const { chips, updateChipValue, resetDefaults } = useChips();
  const [localChips, setLocalChips] = useState(chips);

  useEffect(() => {
    setLocalChips(chips);
  }, [chips]);

  const handleValueChange = (color: string, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const numVal = parseInt(cleanVal);

    if (!isNaN(numVal) && numVal > 0) {
      setLocalChips(prev => prev.map(c => c.color === color ? { ...c, value: numVal } : c));
    } else if (cleanVal === '') {
      // Allow empty
    }
  };

  const handleBlur = (color: string, val: number) => {
    updateChipValue(color, val);
  };

  return (
    <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary" />
          <div>
            <CardTitle className="text-gold-900 dark:text-gold-100">Chip Values</CardTitle>
            <CardDescription className="text-gold-900/60 dark:text-gold-500/60">Customize the monetary value of each chip color.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {localChips.map((chip) => (
            <div key={chip.color} className="flex items-center gap-3 p-3 rounded-lg border border-gold-900/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-gold-500/5 transition-colors">
              <div
                className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center font-bold text-white border-2 border-white/20 ring-1 ring-border/20 ${chip.color === 'blue' ? 'bg-blue-600' :
                  chip.color === 'white' ? 'bg-slate-100 text-slate-900 border-slate-300' :
                    chip.color === 'green' ? 'bg-green-600' :
                      chip.color === 'black' ? 'bg-black' :
                        chip.color === 'red' ? 'bg-red-600' :
                          chip.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}
                style={{
                  backgroundColor: chip.color === 'white' ? '#f3f4f6' : chip.color === 'black' ? '#1a1a1a' : undefined,
                  color: chip.color === 'white' ? '#1f2937' : 'white'
                }}
              >
                {chip.label}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium capitalize text-luxury-primary">{chip.color} Chip</p>
                <p className="text-xs text-gold-900/40 dark:text-muted-foreground">Default: {chip.label}</p>
              </div>
              <div className="w-24">
                <Input
                  type="text"
                  value={chip.value}
                  onChange={(e) => handleValueChange(chip.color, e.target.value)}
                  onBlur={() => handleBlur(chip.color, chip.value)}
                  className="text-right font-mono bg-black/5 dark:bg-white/5 border-gold-900/10 dark:border-white/10 text-gold-900 dark:text-gold-100"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gold-900/10 dark:border-white/10 flex justify-end">
          <Button variant="outline" size="sm" onClick={resetDefaults} className="border-gold-900/10 dark:border-white/10 text-gold-900 dark:text-gold-200 hover:bg-gold-500/10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AISettingsTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchKey = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .single();

      // @ts-ignore
      if (data?.gemini_api_key) {
        setApiKey(data.gemini_api_key); // Keep actual key in state but mask UI
        setIsSaved(true);
      }
      setLoading(false);
    };
    fetchKey();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      // @ts-ignore
      .update({ gemini_api_key: apiKey })
      .eq('id', user.id);

    setLoading(false);
    if (error) {
      toast.error("Failed to save API Key");
      console.error(error);
    } else {
      toast.success("API Key saved");
      setIsSaved(true);
    }
  };

  const handleChange = () => {
    setApiKey('');
    setIsSaved(false);
  };

  return (
    <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-gold-600 dark:text-gold-500" />
          <div>
            <CardTitle className="text-gold-900 dark:text-gold-100">AI Configuration</CardTitle>
            <CardDescription className="text-gold-900/60 dark:text-gold-500/60">Configure settings for the AI Chip Scanner.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gold-900/70 dark:text-gold-200/70 uppercase tracking-widest text-[10px]">Gemini API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={isSaved && !showKey ? "password" : "text"}
                placeholder="AIzaSy..."
                value={isSaved ? "••••••••••••••••••••••••" : apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isSaved || loading}
                className={cn(
                  "bg-black/5 dark:bg-white/5 border-gold-900/10 dark:border-white/10 text-luxury-primary",
                  isSaved && "opacity-50"
                )}
              />
            </div>
            {isSaved ? (
              <Button onClick={handleChange} variant="outline" className="border-gold-900/10 dark:border-white/10 text-gold-900 dark:text-gold-200 hover:bg-gold-500/10">Change Key</Button>
            ) : (
              <Button onClick={handleSave} disabled={loading} className="bg-gold-500 hover:bg-gold-600 text-black font-luxury uppercase tracking-widest text-xs">{loading ? 'Saving...' : 'Save'}</Button>
            )}
          </div>
          <p className="text-xs text-gold-900/40 dark:text-muted-foreground">
            Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-gold-600 dark:text-gold-500 hover:underline">Get one here</a>.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <LuxuryLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48 bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>
      </LuxuryLayout>
    );
  }

  if (!user) return null;

  return (
    <LuxuryLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-gold-600 dark:text-gold-500 hover:text-gold-700 dark:hover:text-gold-400 hover:bg-gold-500/5 font-luxury uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/5 dark:bg-black/20 border border-gold-900/10 dark:border-white/10 p-1 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-gold-500/10 data-[state=active]:text-gold-800 dark:data-[state=active]:text-gold-200">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-luxury uppercase tracking-widest text-[10px]">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="game-settings" className="rounded-lg data-[state=active]:bg-gold-500/10 data-[state=active]:text-gold-800 dark:data-[state=active]:text-gold-200">
              <div className={`w-4 h-4 rounded-full mr-2 bg-gold-500/20 border-2 border-gold-500`} />
              <span className="hidden sm:inline font-luxury uppercase tracking-widest text-[10px]">Chips</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-gold-500/10 data-[state=active]:text-gold-800 dark:data-[state=active]:text-gold-200">
              <Bot className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-luxury uppercase tracking-widest text-[10px]">AI</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="rounded-lg data-[state=active]:bg-gold-500/10 data-[state=active]:text-gold-800 dark:data-[state=active]:text-gold-200">
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-luxury uppercase tracking-widest text-[10px]">Storage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-gold-900/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-gold-600 dark:text-gold-500" />
                  <div>
                    <CardTitle className="text-gold-900 dark:text-gold-100">Profile</CardTitle>
                    <CardDescription className="text-gold-900/60 dark:text-gold-500/60">Your account information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gold-600/40 dark:text-gold-500/40 uppercase tracking-widest text-[10px]">Email</label>
                  <p className="text-lg text-luxury-primary">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gold-600/40 dark:text-gold-500/40 uppercase tracking-widest text-[10px]">User ID</label>
                  <p className="text-sm text-gold-900/60 dark:text-gold-200/60 font-numbers">{user.id}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game-settings">
            <GameSettingsTab />
          </TabsContent>

          <TabsContent value="ai">
            <AISettingsTab />
          </TabsContent>

          <TabsContent value="storage">
            <CacheManager />
          </TabsContent>
        </Tabs>
      </div>
    </LuxuryLayout>
  );
};

export default Profile;
