import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CacheManager } from '@/components/CacheManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useChips } from '@/contexts/ChipContext';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

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
      <CardHeader>
        <CardTitle>Chip Values</CardTitle>
        <CardDescription>Customize the monetary value of each chip color.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {localChips.map((chip) => (
            <div key={chip.color} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className={cn("w-8 h-8 rounded-full border shadow-sm",
                chip.color === 'white' ? 'bg-white border-gray-200' : `bg-${chip.color}-500`)}
                style={{ backgroundColor: chip.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{chip.color} Chip</p>
                <p className="text-xs text-muted-foreground">Default: {chip.label}</p>
              </div>
              <Input
                type="text"
                value={chip.value}
                onChange={(e) => handleValueChange(chip.color, e.target.value)}
                onBlur={() => updateChipValue(chip.color, chip.value)}
                className="w-24 text-right tabular-nums"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset Defaults
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

  useEffect(() => {
    if (!user) return;
    const fetchKey = async () => {
      setLoading(true);
      const { data } = await supabase.from('user_api_keys').select('gemini_api_key').eq('user_id', user.id).maybeSingle();
      // @ts-ignore
      if (data?.gemini_api_key) { setApiKey(data.gemini_api_key); setIsSaved(true); }
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
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>Configure settings for the AI Chip Scanner.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Gemini API Key</label>
          <div className="flex gap-2">
            <Input type="password" value={isSaved ? "••••••••" : apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={isSaved || loading} className="flex-1" />
            {isSaved ? <Button variant="outline" onClick={() => { setApiKey(''); setIsSaved(false); }}>Change</Button> :
              <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);

  if (loading || !user) return <div className="p-8 space-y-6"><Skeleton className="h-12 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="-ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="game-settings">Chips</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm font-medium text-muted-foreground">Email</label><p className="text-lg">{user.email}</p></div>
              <div><label className="text-sm font-medium text-muted-foreground">User ID</label><p className="text-sm font-mono text-muted-foreground">{user.id}</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="game-settings"><GameSettingsTab /></TabsContent>
        <TabsContent value="ai"><AISettingsTab /></TabsContent>
        <TabsContent value="storage"><CacheManager /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
