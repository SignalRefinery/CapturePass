import { DashboardPassPageContent } from "../pass-page";

export default async function DashboardViewPassPage({
  params
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;

  return <DashboardPassPageContent requestedView={view} />;
}
