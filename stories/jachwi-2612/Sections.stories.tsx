import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import data from '@/data/jachwi-2612.json';
import { CostSection, FunnelSection, Hero, MarketSection, PlanSection, ShortlistSection, SourceNote, TrapSection } from '@/components/jachwi/sections';
import { JachwiPage } from '@/components/jachwi/JachwiPage';
import type { JachwiData } from '@/components/jachwi/types';

const d = data as unknown as JachwiData;
const meta: Meta = { title: 'jachwi-2612/Sections' };
export default meta;
export const S0_Hero: StoryObj = { render: () => <Hero d={d} /> };
export const S1_Market: StoryObj = { render: () => <MarketSection d={d} /> };
export const S2_Funnel: StoryObj = { render: () => <FunnelSection d={d} /> };
export const S3_Traps: StoryObj = { render: () => <TrapSection d={d} /> };
export const S4_Cost: StoryObj = { render: () => <CostSection d={d} /> };
export const S5_Shortlist: StoryObj = { render: () => <ShortlistSection d={d} /> };
export const S6_Plan: StoryObj = { render: () => <PlanSection /> };
export const S7_Sources: StoryObj = { render: () => <SourceNote d={d} /> };
export const Page: StoryObj = { render: () => <JachwiPage d={d} />, parameters: { layout: 'fullscreen' } };
