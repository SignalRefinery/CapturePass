import { DashboardPassPageContent } from "./pass-page";

export default async function DashboardPassPage({
  searchParams
}: {
  searchParams?: Promise<{ pass_error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return <DashboardPassPageContent passError={params.pass_error || null} />;
}
