const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface UsdInrRate {
  usdToInr: number;
  asOf: string;
  isLive: boolean;
}

export async function fetchUsdToInrRate(): Promise<UsdInrRate> {
  const response = await fetch(`${API_BASE_URL}/api/v1/currency/rate`);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rate (${response.status})`);
  }
  return response.json() as Promise<UsdInrRate>;
}
