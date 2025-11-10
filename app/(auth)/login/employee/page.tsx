import { EmployeeLoginForm } from "@/components/auth/EmployeeLoginForm";
import { getTranslations } from "next-intl/server";

export default async function EmployeeLoginPage() {
  const t = await getTranslations("auth.employeeLogin");

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">{t("heading")}</h2>
      <EmployeeLoginForm />
    </div>
  );
}


