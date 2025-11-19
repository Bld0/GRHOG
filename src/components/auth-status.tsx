'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

export function AuthStatus() {
  const { isAuthenticated, isLoading, error, login, logout } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await login({ username: 'admin', password: 'pass#1s' });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-sm">Систем руу нэвтэрч байна...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Нэвтрэх төлөв
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Нэвтэрсэн' : 'Нэвтрээгүй'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        <div className="flex gap-2">
          {isAuthenticated ? (
            <Button onClick={logout} variant="outline" size="sm">
              Гарах
            </Button>
          ) : (
            <Button 
              onClick={handleLogin} 
              size="sm"
              disabled={loginLoading}
            >
              {loginLoading ? 'Нэвтэрч байна...' : 'admin-ээр нэвтрэх'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 