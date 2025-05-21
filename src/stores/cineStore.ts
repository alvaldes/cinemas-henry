import { map } from 'nanostores';
import type { Cine } from '@/lib/types';
import { defaultCines } from '@/lib/constants';

export const cineStore = map<Cine>(defaultCines[0]);

export const setCine = (cine: Cine) => {
    cineStore.set(cine)
}