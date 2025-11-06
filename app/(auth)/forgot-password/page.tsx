import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Forgot Password Page (Stub)
 * Placeholder for password reset functionality
 */
export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        Passwort vergessen
      </h2>

      <div className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">
          Diese Funktion ist noch nicht verfügbar.
        </p>
        <p className="text-muted-foreground text-sm">
          Bitte wende dich an die Verwaltung.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück zur Anmeldung</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

