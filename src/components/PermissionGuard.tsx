import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  permissionCode: string;
  children: ReactNode;
}

export default function PermissionGuard({ permissionCode, children }: PermissionGuardProps) {
  const { hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasPermission(permissionCode)) {
      router.push('/403');
    }
  }, [hasPermission, permissionCode, router]);

  if (!hasPermission(permissionCode)) {
    return null;
  }

  return <>{children}</>;
} 