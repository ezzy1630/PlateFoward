"use client";

import { useQuery, useMutation } from "convex/react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, WarningCircle, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { getConvexUrl } from "@/lib/convex/client";

interface OfferPageProps {
  token: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function OfferPageWithConvex({ token }: { token: string }) {
  const [response, setResponse] = useState<"accept" | "decline" | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"accept" | "decline" | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [nextRecipient, setNextRecipient] = useState<{ name: string; organization: string } | null>(null);

  const offer = useQuery(api.offers.getOfferByToken, { token });
  const respondToOffer = useMutation(api.offers.respondToOffer);

  const isLoading = offer === undefined;
  const isExpired = offer && offer.expiresAt < Date.now() && offer.status === "pending";

  const handleRespond = async (action: "accept" | "decline") => {
    setResponseError(null);
    setPendingAction(action);
    try {
      const result = await respondToOffer({ token, response: action });
      setResponse(action);
      if (action === "decline") {
        if (result.nextToken && result.nextRecipient) {
          setNextToken(result.nextToken);
          setNextRecipient(result.nextRecipient);
        } else {
          setNextToken(null);
          setNextRecipient(null);
        }
      }
    } catch {
      setResponseError("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-fog flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <CircleNotch size={32} className="text-orange animate-spin" />
          <p className="text-navy font-medium">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-dvh bg-fog flex items-center justify-center px-4">
        <Card variant="default" className="max-w-md w-full">
          <CardContent className="space-y-4 text-center p-8">
            <WarningCircle size={48} className="text-error mx-auto" weight="fill" />
            <h1 className="font-display text-xl font-bold text-navy">Offer not found</h1>
            <p className="text-sm text-fog-600">
              This offer link is invalid or has been removed.
            </p>
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <ArrowLeft size={16} />
              <Button variant="secondary" size="lg">
                Return home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTimeRemaining = (expiresAt: number): string => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return "Expired";
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} remaining`;
  };

  const getStatusConfig = () => {
    if (response === "accept" || offer.status === "accepted") {
      return {
        icon: CheckCircle,
        color: "text-orange",
        bgColor: "bg-orange-100",
        label: "Accepted",
      };
    }
    if (response === "decline" || offer.status === "declined") {
      return {
        icon: XCircle,
        color: "text-error",
        bgColor: "bg-error-100",
        label: "Declined",
      };
    }
    if (offer.status === "expired" || isExpired) {
      return {
        icon: Clock,
        color: "text-fog-600",
        bgColor: "bg-fog-200",
        label: "Expired",
      };
    }
    return {
      icon: Clock,
      color: "text-orange",
      bgColor: "bg-orange-100",
      label: "Pending response",
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

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
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24" role="main">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 ${statusConfig.bgColor} rounded-full px-4 py-2`}>
            <StatusIcon size={18} className={statusConfig.color} weight="fill" />
            <span className="font-medium text-sm">{statusConfig.label}</span>
          </div>
        </div>

        <Card variant="elevated">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Food</span>
                  <p className="font-medium text-navy">{offer.donation.foodType}</p>
                </div>
                <div>
                  <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Quantity</span>
                  <p className="font-medium text-navy">{offer.donation.quantity} {offer.donation.unit}</p>
                </div>
                <div>
                  <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Pickup by</span>
                  <p className="font-medium text-navy">{formatDate(offer.donation.pickupBy)}</p>
                </div>
                <div>
                  <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Location</span>
                  <p className="font-medium text-navy">{offer.donation.location}</p>
                </div>
              </div>
              {offer.donation.notes && (
                <div className="pt-2 border-t border-navy-100">
                  <span className="text-[0.625rem] font-mono text-fog-600 uppercase tracking-wider">Notes</span>
                  <p className="text-sm text-navy mt-0.5">{offer.donation.notes}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-navy-100 text-fog-600">
                <Clock size={16} />
                <span className="text-xs">Expires: {formatTimeRemaining(offer.expiresAt)}</span>
              </div>
            </div>

            {offer.status === "pending" && !isExpired && !pendingAction && (
              <div className="space-y-3 pt-4 border-t border-navy-100">
                <p className="text-sm text-navy font-medium">
                  This food donation is available for pickup. Would you like to accept it?
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    onClick={() => handleRespond("accept")}
                    className="w-full"
                  >
                    <CheckCircle size={18} weight="fill" />
                    Accept donation
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleRespond("decline")}
                    className="w-full"
                  >
                    <XCircle size={18} weight="fill" />
                    Decline donation
                  </Button>
                </div>
              </div>
            )}

            {pendingAction && !responseError && (
              <div className="space-y-3 pt-4 border-t border-navy-100">
                <div className="flex items-center gap-2 text-orange">
                  <CircleNotch size={16} className="animate-spin" />
                  <span className="text-sm font-medium">Processing {pendingAction === "accept" ? "acceptance" : "decline"}...</span>
                </div>
              </div>
            )}

            {responseError && (
              <div className="p-3 rounded-lg bg-error-100 border border-error/30 text-sm text-error" role="alert">
                {responseError}
              </div>
            )}

            {response === "accept" && !responseError && (
              <div className="pt-4 border-t border-navy-100 space-y-2 text-center">
                <p className="text-sm text-navy font-medium">Thank you for accepting this donation!</p>
                <p className="text-xs text-fog-600">
                  Status updated in real time. Coordinate pickup details directly with the donor.
                </p>
              </div>
            )}

            {offer.status === "declined" && (
              <div className="pt-4 border-t border-navy-100 space-y-2 text-center">
                <p className="text-sm text-navy font-medium">Donation declined</p>
                {nextToken && nextRecipient ? (
                  <div className="space-y-1">
                    <p className="text-xs text-fog-600">
                      Offered to {nextRecipient.name} ({nextRecipient.organization}).
                    </p>
                    <Link
                      href={`/offer/${nextToken}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-orange hover:text-orange/80 transition-colors"
                    >
                      View next offer
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-fog-600">
                    No more recipients available.
                  </p>
                )}
              </div>
            )}

            {(offer.status === "expired" || isExpired) && (
              <div className="pt-4 border-t border-navy-100 space-y-2 text-center">
                <p className="text-sm text-navy font-medium">This offer has expired</p>
                <p className="text-xs text-fog-600">
                  The response window has closed. The donation may have been offered to another recipient.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center font-mono text-[0.625rem] text-fog-600">
          * Confirm pickup details directly with the donor.
        </p>
      </main>
    </div>
  );
}

function OfferPageWithoutConvex({ token }: { token: string }) {
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
        </CardContent>
      </Card>
    </div>
  );
}

export function OfferPage({ token }: OfferPageProps) {
  const convexUrl = useMemo(() => getConvexUrl(), []);

  if (!convexUrl) {
    return <OfferPageWithoutConvex token={token} />;
  }

  return <OfferPageWithConvex token={token} />;
}