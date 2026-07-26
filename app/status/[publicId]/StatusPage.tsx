"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle, WarningCircle, CircleNotch } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { getConvexUrl } from "@/lib/convex/client";

interface StatusPageProps {
  publicId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-fog-600", bgColor: "bg-fog-200" },
  reviewing: { label: "Reviewing", color: "text-orange", bgColor: "bg-orange-100" },
  matching: { label: "Matching", color: "text-orange", bgColor: "bg-orange-100" },
  offered: { label: "Offer sent", color: "text-orange", bgColor: "bg-orange-100" },
  accepted: { label: "Accepted", color: "text-orange", bgColor: "bg-orange-100" },
  declined: { label: "Declined", color: "text-error", bgColor: "bg-error-100" },
  rerouted: { label: "Rerouted", color: "text-orange", bgColor: "bg-orange-100" },
  expired: { label: "Expired", color: "text-fog-600", bgColor: "bg-fog-200" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusPageWithConvex({ publicId }: { publicId: string }) {
  const donation = useQuery(api.donations.getDonationByPublicId, { publicId });

  if (donation === undefined) {
    return (
      <div className="min-h-dvh bg-fog flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <CircleNotch size={32} className="text-orange animate-spin" />
          <p className="text-navy font-medium">Loading status...</p>
          <Badge variant="demo">Demo operation</Badge>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-dvh bg-fog flex items-center justify-center px-4">
        <Card variant="default" className="max-w-md w-full">
          <CardContent className="space-y-4 text-center p-8">
            <WarningCircle size={48} className="text-error mx-auto" weight="fill" />
            <h1 className="font-display text-xl font-bold text-navy">Donation not found</h1>
            <p className="text-sm text-fog-600">
              No donation found with this tracking ID.
            </p>
            <Link href="/">
              <Button variant="secondary" size="lg">
                Return home
              </Button>
            </Link>
            <Badge variant="demo">Demo operation</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[donation.status] ?? {
    label: donation.status,
    color: "text-fog-600",
    bgColor: "bg-fog-200",
  };

  return (
    <div className="min-h-dvh bg-fog safe-area-inset">
      <header className="sticky top-0 z-20 border-b border-navy-100 bg-fog/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-navy hover:text-orange transition-colors min-h-[44px]"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">PlateFoward</span>
          </Link>
          <Badge variant="demo">Demo</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24" role="main">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 ${statusInfo.bgColor} rounded-full px-4 py-2`}>
            {donation.status === "accepted" ? (
              <CheckCircle size={18} className={statusInfo.color} weight="fill" />
            ) : (
              <Clock size={18} className={statusInfo.color} weight="fill" />
            )}
            <span className="font-medium text-sm">{statusInfo.label}</span>
          </div>
          {donation.demoOnly && (
            <Badge variant="demo" className="mt-2">
              Demo operation
            </Badge>
          )}
        </div>

        <Card variant="elevated">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-base font-semibold text-navy">Donation details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Food</span>
                <p className="font-medium text-navy">{donation.foodType}</p>
              </div>
              <div>
                <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Quantity</span>
                <p className="font-medium text-navy">{donation.quantity} {donation.unit}</p>
              </div>
              <div>
                <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Pickup by</span>
                <p className="font-medium text-navy">{formatDate(donation.pickupBy)}</p>
              </div>
              <div>
                <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Location</span>
                <p className="font-medium text-navy">{donation.location}</p>
              </div>
            </div>
            {donation.notes && (
              <div className="pt-2 border-t border-navy-100">
                <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Notes</span>
                <p className="text-sm text-navy mt-0.5">{donation.notes}</p>
              </div>
            )}
            <div className="pt-2 border-t border-navy-100">
              <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Tracking ID</span>
              <p className="font-mono text-xs text-navy mt-0.5">{donation.publicId}</p>
            </div>
          </CardContent>
        </Card>

        {(donation.status === "offered" || donation.status === "accepted" || donation.status === "rerouted") && donation.recipientSnapshots.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-display text-base font-semibold text-navy">Recipients</h3>
            <div className="space-y-3">
              {donation.recipientSnapshots.map((snapshot) => (
                <Card key={snapshot.rank} variant="bordered">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-semibold text-navy">{snapshot.name}</p>
                      <p className="text-xs text-fog-600">{snapshot.organization}</p>
                    </div>
                    <Badge variant="demo">Rank #{snapshot.rank}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center font-mono text-[0.625rem] text-fog-600">
          * This is a demo operation. Not a real food safety or compliance system.
        </p>
      </main>
    </div>
  );
}

function StatusPageWithoutConvex({ publicId: _publicId }: { publicId: string }) {
  return (
    <div className="min-h-dvh bg-fog flex items-center justify-center px-4">
      <Card variant="default" className="max-w-md w-full">
        <CardContent className="space-y-4 text-center p-8">
          <WarningCircle size={48} className="text-error mx-auto" weight="fill" />
          <h1 className="font-display text-xl font-bold text-navy">Convex backend not configured</h1>
          <p className="text-sm text-fog-600">
            The Convex backend is not configured. Set NEXT_PUBLIC_CONVEX_URL to enable realtime features.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            <Button variant="secondary" size="lg">
              Return home
            </Button>
          </Link>
          <Badge variant="demo">Demo operation</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusPage({ publicId }: StatusPageProps) {
  const convexUrl = useMemo(() => getConvexUrl(), []);

  if (!convexUrl) {
    return <StatusPageWithoutConvex publicId={publicId} />;
  }

  return <StatusPageWithConvex publicId={publicId} />;
}
