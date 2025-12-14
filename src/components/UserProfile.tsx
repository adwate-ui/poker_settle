import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Menu, Avatar, UnstyledButton, Text, Group } from "@mantine/core";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userMetadata = user.user_metadata || {};
  const displayName = userMetadata.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = userMetadata.avatar_url;

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Avatar src={avatarUrl} alt={displayName} radius="xl" size="md">
            <User className="h-4 w-4" />
          </Avatar>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <div style={{ padding: '0.5rem' }}>
          <Text fw={500}>{displayName}</Text>
          <Text size="xs" c="dimmed">{user.email}</Text>
        </div>
        <Menu.Divider />
        <Menu.Item leftSection={<Settings className="h-4 w-4" />} onClick={() => navigate('/profile')}>
          Profile & Share Link
        </Menu.Item>
        <Menu.Item leftSection={<LogOut className="h-4 w-4" />} onClick={handleSignOut}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};