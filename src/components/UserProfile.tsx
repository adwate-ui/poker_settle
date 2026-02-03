import React from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none focus:ring-0 group">
          <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent group-hover:ring-gold-500/30 transition-all duration-300">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-black/40 text-gold-500 font-luxury">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-[#0a0a0a]/95 border-gold-500/20 backdrop-blur-xl text-gold-50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
      >
        <DropdownMenuLabel className="p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-luxury font-bold leading-none text-gold-100">{displayName}</p>
            <p className="text-xs leading-none text-white/40">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gold-500/10" />
        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className="p-3 cursor-pointer focus:bg-white/5 focus:text-gold-400 transition-colors"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span className="font-luxury text-sm">Profile & Share Link</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          className="p-3 cursor-pointer focus:bg-white/5 focus:text-red-400 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-luxury text-sm">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};