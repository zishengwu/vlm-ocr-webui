'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/ui/select';

export function Header() {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-lg shadow-black/5">
      <div className="container flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-primary via-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-primary/25 ring-1 ring-white/20">
                <span className="text-primary-foreground font-bold text-sm tracking-wide">VLM</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent tracking-tight">{t('title')}</h1>
              <p className="text-xs text-muted-foreground font-medium">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <Select onValueChange={(lng) => i18n.changeLanguage(lng)} defaultValue={i18n.language}>
            <SelectTrigger className="w-auto h-9 border border-border/50 bg-background/50 hover:bg-accent/80 focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 px-3 rounded-lg backdrop-blur-sm transition-all duration-200">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {i18n.language === 'zh' ? '中文' : 'EN'}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[140px] border border-border/50 bg-card/95 backdrop-blur-sm">
              <SelectItem value="en" className="hover:bg-accent/80">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🇺🇸</span>
                  <span>English</span>
                </div>
              </SelectItem>
              <SelectItem value="zh" className="hover:bg-accent/80">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🇨🇳</span>
                  <span>简体中文</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 border border-border/50 bg-background/50 hover:bg-accent/80 hover:border-primary/20 rounded-lg backdrop-blur-sm transition-all duration-200 group"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}