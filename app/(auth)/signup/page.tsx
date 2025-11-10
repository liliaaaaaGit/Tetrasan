import { SignupForm } from "@/components/auth/SignupForm";
import { getTranslations } from "next-intl/server";

/**
 * Signup Page
 * Registration for pre-approved employees only
 */
export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">{t("heading")}</h2>
      <SignupForm />
    </div>
  );
}

