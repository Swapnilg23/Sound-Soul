import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
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
    <nav className="w-full border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sound2Soul
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors">
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              {user.role === 'creator' && (
                <Link href="/creator/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              )}
              <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block">
                Library
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.creatorProfile?.avatarUrl} alt={user.email} />
                      <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                    <span className="text-sm font-medium">{user.creatorProfile?.artistName || user.email}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuItem>
                  {user.role === 'creator' && (
                    <DropdownMenuItem asChild>
                      <Link href={`/creator/${user.creatorProfile?.slug || 'dashboard'}`} className="cursor-pointer">Public Profile</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    Log out
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
