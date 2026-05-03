'use client';

import { useUser, useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function UserAuth() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/login');
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" className="w-full justify-start">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="size-8">
                <AvatarImage src={user.photoURL || undefined} alt="User avatar" data-ai-hint="person avatar" />
                <AvatarFallback>
                <UserIcon />
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm overflow-hidden">
                <span className="font-semibold text-sidebar-foreground truncate">
                {user.isAnonymous ? 'Anonymous User' : user.email || 'User'}
                </span>
                <span className="text-muted-foreground text-xs truncate" title={user.uid}>
                {user.uid}
                </span>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
        </Button>
    </div>
  );
}
