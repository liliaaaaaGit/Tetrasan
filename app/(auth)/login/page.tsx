import { LoginForm } from "@/components/auth/LoginForm";

/**
 * Login Page
 * Email + password authentication
 */
export default function LoginPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">Anmelden</h2>
      <LoginForm />
    </div>
  );
}

