import { SignupForm } from "@/components/auth/SignupForm";

/**
 * Signup Page
 * Registration for pre-approved employees only
 */
export default function SignupPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">Konto erstellen</h2>
      <SignupForm />
    </div>
  );
}

