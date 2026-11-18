import type { Preview } from '@storybook/nextjs-vite';
import { ThemeProvider } from '@mui/material/styles';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { theme } from '../components/jachwi/theme';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@600;700&family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap" />
        <ScopedCssBaseline sx={{ p: 3, minHeight: '100vh' }}>
          <Story />
        </ScopedCssBaseline>
      </ThemeProvider>
    ),
  ],
  parameters: { options: { storySort: { order: ['jachwi-2612', ['OVERVIEW', 'Docs', 'Data', 'Components', 'Sections', 'Page']] } } },
};
export default preview;
