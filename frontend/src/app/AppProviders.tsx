import { ReactNode } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OHLCVProvider } from './context/OHLCVContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OHLCVProvider>{children}</OHLCVProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
