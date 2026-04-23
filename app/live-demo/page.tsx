import { notFound } from "next/navigation";
import { profileMetadata } from "@/lib/privacy/profile-privacy";

export async function generateMetadata() {
  return profileMetadata();
}

export default function LiveDemoPage() {
  notFound();
}
