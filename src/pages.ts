import { PageDefinition } from '../types';
import { TheEdit } from '../components/TheEdit';

export const PAGES: PageDefinition[] = [
  {
    id: 'press',
    title: 'The Edit',
    description: 'A curated press area for aesthetic trajectories.',
    component: TheEdit,
    path: '/press'
  }
];
