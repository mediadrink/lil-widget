// app/dashboard/page.tsx
// Server redirect to widgets list
import { redirect } from "next/navigation";

export default function DashboardIndexRedirect() {
  redirect("/dashboard/widgets");
}
