
"use client";

import { I18nextProvider } from "react-i18next";
import i18next from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18next}>
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      {children}
    </I18nextProvider>
  );
}
