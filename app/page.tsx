import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware handles the role-home redirect for authenticated users.
  redirect("/login");
}
