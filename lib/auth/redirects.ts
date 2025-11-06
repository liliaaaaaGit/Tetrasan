import { UserRole } from "./session";

/**
 * Get redirect path based on user role
 */
export function redirectByRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/employees";
    case "employee":
      return "/employee/hours";
    default:
      return "/employee/hours";
  }
}

