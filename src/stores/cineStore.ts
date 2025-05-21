import { atom } from 'nanostores';
import type { Cine } from '@/lib/types';
import { defaultCines } from '@/lib/constants';

export const cineStore = atom<Cine>(defaultCines[0]);