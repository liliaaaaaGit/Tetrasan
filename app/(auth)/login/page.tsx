import { LoginForm } from "@/components/auth/LoginForm";
import { getTranslations } from "next-intl/server";

/**
 * Login Page
 * Email + password authentication
 */
export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">{t("heading")}</h2>
      <LoginForm />
    </div>
  );
}

