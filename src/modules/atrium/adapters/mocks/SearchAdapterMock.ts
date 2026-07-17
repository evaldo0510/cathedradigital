import type { SearchAdapter, SearchSuggestion } from '../types';

const SUGGESTIONS: SearchSuggestion[] = [
  { id: 's1', label: 'Eucaristia' },
  { id: 's2', label: 'Graça' },
  { id: 's3', label: 'Santo Tomás' },
  { id: 's4', label: 'Concílio de Trento' },
  { id: 's5', label: 'Lectio Divina' },
];

export const SearchAdapterMock: SearchAdapter = {
  async getSuggestions() {
    return SUGGESTIONS;
  },
};
