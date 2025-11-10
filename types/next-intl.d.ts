declare module "next-intl" {
  import type { ReactNode } from "react";

  interface NextIntlClientProviderProps {
    locale: string;
    messages: Record<string, unknown>;
    children: ReactNode;
  }

  export function NextIntlClientProvider(props: NextIntlClientProviderProps): JSX.Element;
  export function useTranslations(namespace?: string): (key: string) => string;
}

