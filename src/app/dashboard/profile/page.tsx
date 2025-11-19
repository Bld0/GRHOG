'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { getUser, updateUser } from '@/lib/api';
import { User } from '@/types';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  isActive: boolean;
}

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
  });

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll use the current user data since we don't have a profile endpoint
      // In a real app, you'd call getUser(currentUser.id) or a dedicated profile endpoint
      if (currentUser) {
        const userProfile: UserProfile = {
          id: 0, // We don't have this in currentUser
          username: currentUser.username,
          email: currentUser.email,
          phone: null,
          address: null,
          role: currentUser.role,
          isActive: currentUser.isActive || currentUser.active || false
        };
        setProfile(userProfile);
        setEditData({
          username: userProfile.username,
          email: userProfile.email,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    try {
      setIsEditing(true);
      
      // For now, we'll just update the local state since we don't have a profile update endpoint
      // In a real app, you'd call updateUser(profile.id, editData)
      const updatedProfile: UserProfile = {
        ...profile,
        username: editData.username,
        email: editData.email,
      };
      
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsEditing(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrator';
      case 'ADMIN':
        return 'Administrator';
      case 'VIEWER':
        return 'Viewer';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProfile}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground">Unable to load user profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              {isEditing ? (
                <Input
                  id="username"
                  value={editData.username}
                  onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-2">{profile.username}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-2">{profile.email}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              System account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Status</Label>
              <p className="text-sm text-muted-foreground py-2">
                {profile.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div>
              <Label>Role</Label>
              <p className="text-sm text-muted-foreground py-2">
                {profile.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : profile.role === 'ADMIN' ? 'ADMIN' : 'VIEWER'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                // Reset edit data to original values
                setEditData({
                  username: profile.username,
                  email: profile.email,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isEditing}>
              {isEditing ? 'Updating...' : 'Update Profile'}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}
