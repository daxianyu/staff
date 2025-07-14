'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { handleUserRedirect } from '@/services/auth';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      handleUserRedirect(user, router);
    } else {
      router.push('/login');
    }
  }, [router, user]);

  return null;
}
