import { redirect } from "next/navigation";

// Root page redirects to employee hours view
export default function HomePage() {
  redirect("/employee/hours");
}

