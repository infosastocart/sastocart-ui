import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";

interface AdminPermissions {
  role: 'superadmin' | 'subadmin' | 'user';
  permissions: string[];
}

export function useAdminPermissions() {
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const { data, isLoading, error } = useQuery<AdminPermissions>({
    queryKey: ['adminPermissions', email],
    queryFn: async () => {
      if (!email) return { role: 'user', permissions: [] };
      if (email === 'info.sastocart@gmail.com') {
        return { role: 'superadmin', permissions: ['dashboard', 'orders', 'products', 'customers', 'blog', 'team', 'settings'] };
      }
      const res = await fetch(`/api/admin/me?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        if (res.status === 404) return { role: 'user', permissions: [] };
        throw new Error('Failed to fetch admin permissions');
      }
      return res.json();
    },
    enabled: isLoaded && !!email,
  });

  const isHardcodedAdmin = email === 'info.sastocart@gmail.com';

  return {
    role: isHardcodedAdmin ? 'superadmin' : (data?.role || 'user'),
    permissions: isHardcodedAdmin ? ['dashboard', 'orders', 'products', 'customers', 'blog', 'team', 'settings'] : (data?.permissions || []),
    isLoading: !isLoaded || (isLoading && !isHardcodedAdmin),
    error
  };
}
