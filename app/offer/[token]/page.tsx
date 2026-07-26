import { Metadata } from "next";
import { OfferPage } from "./OfferPage";

export const metadata: Metadata = {
  title: "Food Donation Offer | PlateFoward",
  description: "Review and respond to a food donation offer",
  robots: "noindex, nofollow",
};

interface OfferPageProps {
  params: Promise<{ token: string }>;
}

export default async function OfferPageWrapper({ params }: OfferPageProps) {
  const { token } = await params;
  return <OfferPage token={token} />;
}