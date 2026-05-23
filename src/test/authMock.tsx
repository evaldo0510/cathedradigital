import { vi } from 'vitest';
import React from 'react';

export const mockAuthUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockProfile = {
  id: 'user-123',
  name: 'Test User',
  is_premium: true,
  role: 'user',
  avatar_url: null,
  xp: 100,
  streak: 5,
  level: 2,
};

export const defaultAuthContext = {
  user: null,
  profile: null,
  loading: false,
  signOut: vi.fn(() => Promise.resolve()),
  isPremium: true,
  userLevel: 'iniciante',
  refreshProfile: vi.fn(() => Promise.resolve()),
};

export const authenticatedAuthContext = {
  ...defaultAuthContext,
  user: mockAuthUser,
  profile: mockProfile,
};

export const renderWithAuth = (ui: React.ReactNode, contextValue = defaultAuthContext) => {
  // We'll use this in a custom render if needed, but the main goal is to provide a standard mock for useAuth
  return ui; 
};
