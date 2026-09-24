import { NextRequest, NextResponse } from 'next/server';
import { optimizeItinerary } from '@/lib/optimizer/pareto';
import { getCityById, POPULAR_CITIES } from '@/lib/data/destinations';
import { TripPreferences } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      origin = 'Paris',
      destination = 'Amsterdam',
      startDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      endDate = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      travelers = 1,
      budget = 1000,
      priority = 'balanced',
      preferredModes,
    } = body;

    let originNode = getCityById(origin);
    let destinationNode = getCityById(destination);

    // Fallbacks if user typed custom city
    if (!originNode) {
      originNode = POPULAR_CITIES[0]; // Paris
    }
    if (!destinationNode) {
      destinationNode = POPULAR_CITIES[1]; // Amsterdam
    }

    const prefs: TripPreferences = {
      origin: originNode.name,
      destination: destinationNode.name,
      startDate,
      endDate,
      travelers: Number(travelers) || 1,
      budget: Number(budget) || 1000,
      priority: priority as any,
      preferredModes,
    };

    const optimizationResult = optimizeItinerary(originNode, destinationNode, prefs);

    return NextResponse.json({
      success: true,
      data: optimizationResult,
    });
  } catch (error: any) {
    console.error('Failed to optimize trip:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
