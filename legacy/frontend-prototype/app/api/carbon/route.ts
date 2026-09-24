import { NextRequest, NextResponse } from 'next/server';
import {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateBaselineEmissions,
  calculateTreesEquivalent,
} from '@/lib/carbon/calculator';
import { TransportMode, HotelTier } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      distanceKm = 500,
      mode = 'train' as TransportMode,
      passengers = 1,
      nights = 3,
      hotelTier = 'eco_hotel' as HotelTier,
    } = body;

    const transportCarbon = calculateTransportEmissions(distanceKm, mode, passengers);
    const hotelCarbon = calculateAccommodationEmissions(hotelTier, nights);
    const totalCarbon = Math.round((transportCarbon + hotelCarbon) * 10) / 10;

    const baseline = calculateBaselineEmissions(distanceKm, nights, passengers);
    const savedCarbon = Math.max(0, Math.round((baseline - totalCarbon) * 10) / 10);
    const savingsPct = Math.round((savedCarbon / baseline) * 100);
    const trees = calculateTreesEquivalent(savedCarbon);

    return NextResponse.json({
      success: true,
      data: {
        transportCarbonKg: transportCarbon,
        hotelCarbonKg: hotelCarbon,
        totalCarbonKg: totalCarbon,
        baselineCarbonKg: baseline,
        savedCarbonKg: savedCarbon,
        savingsPercentage: savingsPct,
        treesEquivalent: trees,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate carbon' },
      { status: 500 }
    );
  }
}
