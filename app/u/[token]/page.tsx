import { redirect } from "next/navigation";
import { profileMetadata } from "@/lib/privacy/profile-privacy";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata() {
  return profileMetadata({ visibility: "private" });
}

export default async function PrivateTokenProfilePage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/pass/${token}`);
}
