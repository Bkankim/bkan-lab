// 작업대(DDD 2.4). 실험별 글·데이터·컴포넌트를 한곳에 올린다. 배포 대상이 아니다(로컬 전용).
import path from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: { name: '@storybook/nextjs-vite', options: {} },
  staticDirs: ['../public'],
  // tsconfig의 '@/*' 별칭을 Vite에도 알린다
  viteFinal: async (c) => {
    // Storybook이 넘기는 alias는 배열일 수 있어 배열로 합친다
    const prev = c.resolve?.alias ?? [];
    const list = Array.isArray(prev) ? prev : Object.entries(prev).map(([find, replacement]) => ({ find, replacement }));
    return { ...c, resolve: { ...c.resolve, alias: [...list, { find: /^@\//, replacement: path.resolve(import.meta.dirname, '..') + '/' }] } };
  },
};
export default config;
