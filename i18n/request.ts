import { defineRequestConfig } from "next-intl/server";

import { getRequestLocale } from "./get-request-locale";
import { getMessagesWithFallback } from "./get-messages";

export default defineRequestConfig(async () => {
  const locale = await getRequestLocale();
  const messages = await getMessagesWithFallback(locale);

  return {
    locale,
    messages,
  };
});

