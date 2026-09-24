import type { HotelListing } from '@/lib/hotelApi';

const STORAGE_KEY = 'ecoroute_hotel_search_last';

interface StoredHotelSearch {
  destinationName: string;
  hotels: HotelListing[];
}

export function saveHotelSearchResults(destinationName: string, hotels: HotelListing[]): void {
  const record: StoredHotelSearch = { destinationName, hotels };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function loadHotelById(hotelId: string): { destinationName: string; hotel: HotelListing } | null {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const record = JSON.parse(raw) as StoredHotelSearch;
  const hotel = record.hotels.find((h) => h.id === hotelId);
  return hotel ? { destinationName: record.destinationName, hotel } : null;
}
