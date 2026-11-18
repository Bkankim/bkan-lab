import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import data from '@/data/jachwi-2612.json';
import { FloorStack, UseLegend } from '@/components/jachwi/FloorStack';
import type { JachwiData } from '@/components/jachwi/types';

const d = data as unknown as JachwiData;
const meta: Meta<typeof FloorStack> = { title: 'jachwi-2612/Components/FloorStack', component: FloorStack };
export default meta;
type S = StoryObj<typeof FloorStack>;

export const Basement: S = { args: { building: d.traps[0].building, at: d.traps[0].at } };
export const Goshiwon: S = { args: { building: d.traps[1].building, at: d.traps[1].at } };
export const Office: S = { args: { building: d.traps[2].building, at: d.traps[2].at } };
export const Phantom: S = { args: { building: d.traps[3].building, at: d.traps[3].at } };
export const Compact: S = { args: { building: d.traps[1].building, at: 3, compact: true } };
export const Legend: StoryObj = { render: () => <UseLegend /> };
