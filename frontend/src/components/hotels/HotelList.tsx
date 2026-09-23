'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Info, Loader2, MapPin, Star, X } from 'lucide-react';
import { searchHotels, type AccommodationTier, type HotelListing } from '@/lib/hotelApi';
import {
  cancelBooking,
  createBooking,
  createCheckoutSession,
  isPaymentConfigured,
  listTripBookings,
  PaymentNotConfiguredError,
  type Booking,
} from '@/lib/api-client';

interface HotelListProps {
  tripId: string;
  destinationName: string;
  destinationCountry: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  tier?: AccommodationTier;
}

export function HotelList({
  tripId,
  destinationName,
  destinationCountry,
  checkIn,
  checkOut,
  guests,
  tier,
}: HotelListProps) {
  const [hotels, setHotels] = useState<HotelListing[] | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // hotelId -> saved booking, once reserved on this trip
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [pendingHotelId, setPendingHotelId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [paymentConfigured, setPaymentConfigured] = useState(true); // optimistic default; corrected below

  useEffect(() => {
    let cancelled = false;
    setHotels(null);
    setError(null);

    searchHotels({ destinationName, destinationCountry, checkIn, checkOut, guests, tier })
      .then((result) => {
        if (cancelled) return;
        setHotels(result.hotels);
        setDisclaimer(result.disclaimer);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Hotel listings are temporarily unavailable.');
      });

    listTripBookings(tripId)
      .then((existing) => {
        if (cancelled) return;
        setBookings(Object.fromEntries(existing.map((b) => [b.hotelId, b])));
      })
      .catch(() => {
        // Non-fatal: listings still work, just without "already reserved" state.
      });

    isPaymentConfigured().then((configured) => {
      if (!cancelled) setPaymentConfigured(configured);
    });

    return () => {
      cancelled = true;
    };
  }, [tripId, destinationName, destinationCountry, checkIn, checkOut, guests, tier]);

  async function handleReserve(hotel: HotelListing) {
    setActionError(null);
    setPendingHotelId(hotel.id);
    try {
      const booking = await createBooking({
        tripId,
        hotelId: hotel.id,
        hotelName: hotel.name,
        tier: hotel.tier,
        checkIn,
        checkOut,
        guests,
        pricePerNightUsd: hotel.pricePerNightUsd,
        totalPriceUsd: hotel.totalPriceUsd,
      });
      setBookings((prev) => ({ ...prev, [hotel.id]: booking }));
    } catch {
      setActionError('Could not save that reservation. Please try again.');
    } finally {
      setPendingHotelId(null);
    }
  }

  async function handlePay(hotel: HotelListing) {
    const booking = bookings[hotel.id];
    if (!booking) return;
    setActionError(null);
    setPaymentNotice(null);
    setPendingHotelId(hotel.id);
    try {
      const { checkoutUrl } = await createCheckoutSession({
        bookingId: booking.id,
        successUrl: `${window.location.origin}${window.location.pathname}?payment=success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      if (err instanceof PaymentNotConfiguredError) {
        setPaymentNotice(err.message);
      } else {
        setActionError('Could not start checkout. Please try again.');
      }
    } finally {
      setPendingHotelId(null);
    }
  }

  async function handleCancel(hotel: HotelListing) {
    const booking = bookings[hotel.id];
    if (!booking) return;
    setActionError(null);
    setPendingHotelId(hotel.id);
    try {
      await cancelBooking(booking.id);
      setBookings((prev) => {
        const next = { ...prev };
        delete next[hotel.id];
        return next;
      });
    } catch {
      setActionError('Could not cancel that reservation. Please try again.');
    } finally {
      setPendingHotelId(null);
    }
  }

  if (error) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
        <AlertTriangle className="h-4 w-4 flex-none" />
        {error}
      </p>
    );
  }

  if (!hotels) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding places to stay…
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
        {disclaimer}
      </p>
      {actionError && (
        <p className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-none" />
          {actionError}
        </p>
      )}
      {paymentNotice && (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
          {paymentNotice}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {hotels.map((hotel) => {
          const booking = bookings[hotel.id];
          const isPending = pendingHotelId === hotel.id;
          return (
            <div key={hotel.id} className="card-hover rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{hotel.name}</h3>
                <span className="flex flex-none items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                  <Star className="h-3 w-3 fill-current" />
                  {hotel.rating.toFixed(1)}
                </span>
              </div>
              <p className="mb-2 flex items-center gap-1 text-xs capitalize text-slate-500">
                <MapPin className="h-3 w-3" />
                {hotel.distanceFromCenterKm.toFixed(1)} km from center · {hotel.tier} tier
              </p>
              <div className="mb-2 flex flex-wrap gap-1">
                {hotel.amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    {amenity}
                  </span>
                ))}
              </div>
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-slate-900">${hotel.pricePerNightUsd}</span>
                <span className="text-xs text-slate-400">/night · ${hotel.totalPriceUsd} total</span>
              </div>
              {booking ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      Saved to your trip
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancel(hotel)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      Cancel
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePay(hotel)}
                    disabled={isPending}
                    title={!paymentConfigured ? 'No payment provider is connected yet' : undefined}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                    Pay &amp; confirm
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleReserve(hotel)}
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-600 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? 'Saving…' : 'Reserve (demo)'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
