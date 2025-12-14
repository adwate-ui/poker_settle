import { useState, useEffect } from 'react';
import { Button, Card, Stack, Group, Text, ActionIcon } from '@mantine/core';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || dismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom">
      <Card shadow="xl" padding="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4} style={{ flex: 1 }}>
              <Group gap="xs">
                <Download className="h-5 w-5 text-primary" />
                <Text size="md" fw={600}>Install Poker Tracker</Text>
              </Group>
              <Text size="xs" c="dimmed">
                Install for faster access and offline play
              </Text>
            </Stack>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </ActionIcon>
          </Group>
          <Group gap="xs">
            <Button
              onClick={handleInstall}
              disabled={installing}
              size="sm"
              style={{ flex: 1 }}
            >
              {installing ? 'Installing...' : 'Install App'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDismiss}
            >
              Not Now
            </Button>
          </Group>
        </Stack>
      </Card>
    </div>
  );
};
