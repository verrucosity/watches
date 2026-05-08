import { NextRequest } from "next/server";

type DummyProduct = {
  id: number;
  title: string;
  brand?: string;
  price: number;
  category?: string;
  rating?: number;
  thumbnail?: string;
  images?: string[];
};

type WatchApiItem = {
  id: string;
  brand: string;
  model: string;
  reference: string;
  tier: "Entry" | "Mid" | "High" | "Haute";
  price: number;
  marketDelta: number;
  popularity: number;
  accent: string;
  imageUrl?: string;
  source: "live-api";
};

const accents = [
  "from-sky-300 to-blue-700",
  "from-amber-300 to-orange-700",
  "from-emerald-300 to-green-700",
  "from-rose-300 to-red-700",
  "from-indigo-300 to-violet-700",
];

function tierFromPrice(price: number): WatchApiItem["tier"] {
  if (price < 1500) return "Entry";
  if (price < 8000) return "Mid";
  if (price < 25000) return "High";
  return "Haute";
}

function normalizeWatch(product: DummyProduct, index: number): WatchApiItem {
  const brand = product.brand?.trim() || "Market";
  const model = product.title?.trim() || "Watch";
  const refSeed = `${brand}-${model}-${product.id}`.replace(/\s+/g, "-").toUpperCase();
  const reference = refSeed.slice(0, 16);
  const price = Number(product.price) || 0;
  const rating = Number(product.rating) || 3.5;

  return {
    id: `api-${product.id}`,
    brand,
    model,
    reference,
    tier: tierFromPrice(price),
    price,
    marketDelta: Number((rating - 3).toFixed(1)),
    popularity: Math.min(99, Math.max(55, Math.round(rating * 20))),
    accent: accents[index % accents.length],
    imageUrl: product.images?.[0] || product.thumbnail,
    source: "live-api",
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "watch";
  const query = encodeURIComponent(q);

  try {
    const response = await fetch(
      `https://dummyjson.com/products/search?q=${query}&limit=16&select=id,title,brand,price,category,rating,thumbnail,images`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return Response.json(
        { error: `Upstream API failed with status ${response.status}` },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as { products?: DummyProduct[] };
    const products = payload.products ?? [];

    const watches = products
      .filter((product) => {
        const category = product.category?.toLowerCase() ?? "";
        const title = product.title?.toLowerCase() ?? "";
        return category.includes("watch") || title.includes("watch") || q.toLowerCase().includes("watch");
      })
      .map(normalizeWatch);

    return Response.json({ source: "dummyjson", count: watches.length, watches });
  } catch {
    return Response.json(
      { error: "Could not fetch live watch data right now." },
      { status: 500 },
    );
  }
}
