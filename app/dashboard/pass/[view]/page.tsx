import { redirect } from "next/navigation";

export default async function DashboardViewPassPage({
  searchParams
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  if (params.token) {
    redirect(`/dashboard/pass?token=${encodeURIComponent(params.token)}`);
  }

  redirect("/dashboard/pass");
}
