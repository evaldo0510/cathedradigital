import { describe, it, expect } from 'vitest';
import { canUserAccess, isRouteProtectedForAdmin } from './auth-utils';
import { AppRoute } from '@/types';

describe('Authorization Utilities', () => {
  describe('isRouteProtectedForAdmin', () => {
    it('should identify admin routes', () => {
      expect(isRouteProtectedForAdmin(AppRoute.ADMIN)).toBe(true);
      expect(isRouteProtectedForAdmin(AppRoute.VISUAL_AUDIT)).toBe(true);
      expect(isRouteProtectedForAdmin('/admin/settings')).toBe(true);
    });

    it('should identify non-admin routes', () => {
      expect(isRouteProtectedForAdmin(AppRoute.HOME)).toBe(false);
      expect(isRouteProtectedForAdmin(AppRoute.HOJE)).toBe(false);
      expect(isRouteProtectedForAdmin(AppRoute.BIBLE)).toBe(false);
    });
  });

  describe('canUserAccess', () => {
    it('should allow admin to access admin routes', () => {
      expect(canUserAccess('admin', AppRoute.ADMIN)).toBe(true);
      expect(canUserAccess('admin', AppRoute.VISUAL_AUDIT)).toBe(true);
    });

    it('should deny non-admin access to admin routes', () => {
      expect(canUserAccess('pilgrim', AppRoute.ADMIN)).toBe(false);
      expect(canUserAccess('scholar', AppRoute.ADMIN)).toBe(false);
      expect(canUserAccess(null, AppRoute.ADMIN)).toBe(false);
      expect(canUserAccess(undefined, AppRoute.ADMIN)).toBe(false);
    });

    it('should allow anyone to access public routes', () => {
      expect(canUserAccess('pilgrim', AppRoute.HOME)).toBe(true);
      expect(canUserAccess(null, AppRoute.HOME)).toBe(true);
      expect(canUserAccess('admin', AppRoute.HOME)).toBe(true);
    });
  });
});
