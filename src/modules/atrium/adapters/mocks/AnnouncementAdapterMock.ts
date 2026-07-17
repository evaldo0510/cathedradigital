import type { AnnouncementAdapter, AnnouncementItem } from '../types';

const NOW = new Date().toISOString();

const ITEMS: AnnouncementItem[] = [
  { id: 'a1', label: 'Novo curso: Introdução à Patrística',  publishedAt: NOW },
  { id: 'a2', label: 'Lectio Divina semanal atualizada',     publishedAt: NOW },
];

export const AnnouncementAdapterMock: AnnouncementAdapter = {
  async getRecent() {
    return ITEMS;
  },
};
