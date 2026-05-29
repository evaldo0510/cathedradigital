import { describe, it, expect } from 'vitest';
import { isHojeActive, isRouteActive } from './navigation-utils';
import { AppRoute } from '@/types';

describe('navigation-utils', () => {
  describe('isHojeActive', () => {
    it('should return true for root path "/"', () => {
      expect(isHojeActive('/')).toBe(true);
    });

    it('should return true for "/hoje"', () => {
      expect(isHojeActive('/hoje')).toBe(true);
    });

    it('should return true for "/hoje/"', () => {
      expect(isHojeActive('/hoje/')).toBe(true);
    });

    it('should return true for sub-routes like "/hoje/reflexao"', () => {
      expect(isHojeActive('/hoje/reflexao')).toBe(true);
    });

    it('should return true when query strings are present', () => {
      expect(isHojeActive('/?ref=share')).toBe(true);
      expect(isHojeActive('/hoje?tab=selected')).toBe(true);
      expect(isHojeActive('/hoje/123?utm=camp')).toBe(true);
    });

    it('should return false for other routes', () => {
      expect(isHojeActive('/bible')).toBe(false);
      expect(isHojeActive('/catechism')).toBe(false);
      expect(isHojeActive('/profile')).toBe(false);
    });

    it('should return false for routes starting with /hoje but not being subpaths', () => {
      // Though unlikely with standard routing, we check the logic
      expect(isHojeActive('/hoje-extra')).toBe(false);
    });
  });

  describe('isRouteActive', () => {
    it('should handle "Hoje" items correctly', () => {
      expect(isRouteActive(AppRoute.HOJE, '/')).toBe(true);
      expect(isRouteActive(AppRoute.HOJE, '/hoje')).toBe(true);
      expect(isRouteActive(AppRoute.HOJE, '/hoje/sub')).toBe(true);
      expect(isRouteActive(AppRoute.HOJE, '/bible')).toBe(false);
    });

    it('should handle exact matches', () => {
      expect(isRouteActive(AppRoute.BIBLE, '/bible')).toBe(true);
      expect(isRouteActive(AppRoute.CATECHISM, '/catechism')).toBe(true);
    });

    it('should handle nested routes', () => {
      expect(isRouteActive(AppRoute.BIBLE, '/bible/genesis/1')).toBe(true);
      expect(isRouteActive(AppRoute.CATECHISM, '/catechism/123')).toBe(true);
    });

    it('should not match partial string if not a subpath', () => {
      expect(isRouteActive('/bible', '/bible-study')).toBe(false);
    });

    it('should handle root route item correctly', () => {
      // If we have an item that points to '/', it should behave like Hoje item
      expect(isRouteActive('/', '/')).toBe(true);
      expect(isRouteActive('/', '/hoje')).toBe(true);
      expect(isRouteActive('/', '/bible')).toBe(false);
    });
    
    it('should ignore query strings in currentPath', () => {
      expect(isRouteActive(AppRoute.BIBLE, '/bible?verse=1')).toBe(true);
      expect(isRouteActive(AppRoute.CATECHISM, '/catechism#para100')).toBe(true);
    });
  });
});
