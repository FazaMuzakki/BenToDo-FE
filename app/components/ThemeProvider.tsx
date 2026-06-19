"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Natively forces dark mode and bypasses localStorage if on the Focus route
  const forcedTheme = pathname?.startsWith('/focus') ? 'dark' : undefined;

  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem 
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
