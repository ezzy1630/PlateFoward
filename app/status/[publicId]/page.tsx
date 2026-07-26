import { Metadata } from "next";
import { StatusPage } from "./StatusPage";

export const metadata: Metadata = {
  title: "Donation Status | PlateFoward",
  description: "Track your food donation status",
  robots: "noindex, nofollow",
};

interface StatusPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function StatusPageWrapper({ params }: StatusPageProps) {
  const { publicId } = await params;
  return <StatusPage publicId={publicId} />;
}
