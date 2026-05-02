import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLogout } from '@workspace/api-client-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync(undefined);
      logout();
      setLocation('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <nav className="w-full bg-background/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent select-none">
            Sound2Soul
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
              Explore
            </Link>
            {user?.role === 'creator' && (
              <Link href="/creator/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 px-3 py-1.5">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2 rounded-full hover:bg-primary/90 transition-colors duration-150"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 hidden md:block">
                Library
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-8 w-8 rounded-full ring-2 ring-white/10 hover:ring-primary/50 transition-all duration-150 overflow-hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.creatorProfile?.avatarUrl} alt={user.email} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {user.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
                  <DropdownMenuItem className="flex flex-col items-start gap-0.5 p-4 cursor-default focus:bg-transparent">
                    <span className="text-sm font-medium">{user.creatorProfile?.artistName || user.email}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuItem>
                  {user.role === 'creator' && (
                    <DropdownMenuItem asChild>
                      <Link href={`/creator/${user.creatorProfile?.slug || 'dashboard'}`} className="cursor-pointer">
                        Public Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
