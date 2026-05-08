export type Tier = "Entry" | "Mid" | "High" | "Haute";

export type WatchSpecs = {
  movement: string;
  caseSize: string;
  lugToLug: string;
  waterResistance: string;
  powerReserve: string;
  crystal: string;
  strap: string;
};

export type Watch = {
  id: string;
  brand: string;
  model: string;
  reference: string;
  tier: Tier;
  price: number;
  marketDelta: number;
  popularity: number;
  accent: string;
  imageUrl?: string;
  specs?: WatchSpecs;
  source?: "curated" | "live-api";
};

export type TrackedWatch = {
  watchId: string;
  targetPrice: number;
  note: string;
};

export type OwnedWatch = {
  watchId: string;
  purchasedPrice: number;
  purchasedAt: string;
  condition: "Mint" | "Excellent" | "Good" | "Worn";
};

export const TRACKED_KEY = "chronovault-tracked";
export const OWNED_KEY = "chronovault-owned";
export const EXTRA_WATCHES_KEY = "chronovault-extra-watches";

export const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const percentage = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  signDisplay: "always",
});

export const tierOrder: Array<Tier | "All"> = ["All", "Entry", "Mid", "High", "Haute"];

export const FALLBACK_WATCH_IMAGE =
  "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/1.webp";

export function hashNumber(input: string) {
  return Array.from(input).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export function getWatchImageUrl(watch: Pick<Watch, "imageUrl">) {
  return watch.imageUrl || FALLBACK_WATCH_IMAGE;
}

export function getWatchSpecs(watch: Watch): WatchSpecs {
  if (watch.specs) {
    return watch.specs;
  }

  const brand = watch.brand.toLowerCase();
  const model = watch.model.toLowerCase();

  const movement =
    brand.includes("grand seiko") || brand.includes("seiko")
      ? "Automatic (Caliber 9S)"
      : brand.includes("casio")
        ? "Quartz Digital"
        : brand.includes("orient") || brand.includes("citizen")
          ? "Automatic"
          : watch.tier === "Haute"
            ? "In-House Automatic"
            : watch.tier === "High"
              ? "Automatic Chronometer"
              : "Automatic";

  const caseSize =
    watch.tier === "Entry"
      ? "38-41mm"
      : watch.tier === "Mid"
        ? "39-41mm"
        : watch.tier === "High"
          ? "40-42mm"
          : "40-41mm";

  const lugToLug =
    watch.tier === "Entry"
      ? "45mm"
      : watch.tier === "Mid"
        ? "47mm"
        : watch.tier === "High"
          ? "48mm"
          : "49mm";

  const waterResistance =
    model.includes("sub") || model.includes("bay") || model.includes("div")
      ? "200m"
      : model.includes("g-shock")
        ? "200m"
        : watch.tier === "Entry"
          ? "100m"
          : watch.tier === "Mid"
            ? "150m"
            : "100m";

  const powerReserve =
    movement.includes("Quartz") ? "Battery" : watch.tier === "Haute" ? "70h" : watch.tier === "High" ? "60h" : "40h";

  const crystal = watch.tier === "Entry" ? "Mineral / Sapphire" : "Sapphire";

  const strap =
    model.includes("belt") || model.includes("bambino") || model.includes("presage")
      ? "Leather Strap"
      : model.includes("g-shock")
        ? "Resin Strap"
        : "Steel Bracelet";

  return {
    movement,
    caseSize,
    lugToLug,
    waterResistance,
    powerReserve,
    crystal,
    strap,
  };
}

export const WATCH_CATALOG: Watch[] = [
  {
    id: "casio-f91w",
    brand: "Casio",
    model: "F91W Classic",
    reference: "F-91W-1",
    tier: "Entry",
    price: 95,
    marketDelta: 1.4,
    popularity: 91,
    accent: "from-zinc-300 to-zinc-700",
  },
  {
    id: "timex-weekender",
    brand: "Timex",
    model: "Weekender",
    reference: "TW2R42400",
    tier: "Entry",
    price: 110,
    marketDelta: 1.1,
    popularity: 86,
    accent: "from-neutral-300 to-stone-700",
  },
  {
    id: "swatch-gent",
    brand: "Swatch",
    model: "Original Gent",
    reference: "SO28B704",
    tier: "Entry",
    price: 120,
    marketDelta: 1.7,
    popularity: 84,
    accent: "from-cyan-300 to-sky-700",
  },
  {
    id: "womens-wrist-watch",
    brand: "Chronique",
    model: "Women's Wrist Watch",
    reference: "C-WW-194",
    tier: "Entry",
    price: 129.99,
    marketDelta: 0.9,
    popularity: 75,
    accent: "from-rose-300 to-red-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/womens-watches/women%27s-wrist-watch/1.webp",
  },
  {
    id: "brown-leather-belt-watch",
    brand: "Naviforce",
    model: "Brown Leather Belt Watch",
    reference: "NF-BLB-93",
    tier: "Entry",
    price: 89.99,
    marketDelta: 1.2,
    popularity: 80,
    accent: "from-amber-300 to-orange-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/1.webp",
  },
  {
    id: "citizen-tsuyosa",
    brand: "Citizen",
    model: "Tsuyosa",
    reference: "NJ0150-81X",
    tier: "Entry",
    price: 360,
    marketDelta: 2.4,
    popularity: 84,
    accent: "from-yellow-300 to-amber-700",
  },
  {
    id: "orient-bambino",
    brand: "Orient",
    model: "Bambino",
    reference: "RA-AC0M04Y",
    tier: "Entry",
    price: 240,
    marketDelta: 1.9,
    popularity: 82,
    accent: "from-stone-300 to-zinc-700",
  },
  {
    id: "seiko-presage",
    brand: "Seiko",
    model: "Presage Cocktail Time",
    reference: "SRPB43",
    tier: "Entry",
    price: 520,
    marketDelta: 2.8,
    popularity: 88,
    accent: "from-orange-300 to-red-700",
  },
  {
    id: "casio-gshock-square",
    brand: "Casio",
    model: "G-Shock Square",
    reference: "DW-5600E-1V",
    tier: "Entry",
    price: 120,
    marketDelta: 1.6,
    popularity: 90,
    accent: "from-zinc-400 to-slate-800",
  },
  {
    id: "seiko-5-gmt",
    brand: "Seiko",
    model: "5 Sports GMT",
    reference: "SSK003",
    tier: "Entry",
    price: 420,
    marketDelta: 4.1,
    popularity: 92,
    accent: "from-orange-300 to-amber-600",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/1.webp",
  },
  {
    id: "hamilton-murph",
    brand: "Hamilton",
    model: "Khaki Field Murph",
    reference: "H70405730",
    tier: "Entry",
    price: 895,
    marketDelta: 2.7,
    popularity: 88,
    accent: "from-stone-300 to-neutral-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/1.webp",
  },
  {
    id: "tissot-prx",
    brand: "Tissot",
    model: "PRX Powermatic 80",
    reference: "T137.407.11.041.00",
    tier: "Entry",
    price: 725,
    marketDelta: 6.8,
    popularity: 95,
    accent: "from-cyan-300 to-sky-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/1.webp",
  },
  {
    id: "longines-zulu-time",
    brand: "Longines",
    model: "Spirit Zulu Time",
    reference: "L3.812.4.93.6",
    tier: "Mid",
    price: 3000,
    marketDelta: 3.6,
    popularity: 87,
    accent: "from-emerald-300 to-green-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/1.webp",
  },
  {
    id: "tudor-bb58",
    brand: "Tudor",
    model: "Black Bay 58",
    reference: "M79030N",
    tier: "Mid",
    price: 3900,
    marketDelta: 5.4,
    popularity: 93,
    accent: "from-rose-300 to-red-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/1.webp",
  },
  {
    id: "grand-seiko-snowflake",
    brand: "Grand Seiko",
    model: "Snowflake",
    reference: "SBGA211",
    tier: "Mid",
    price: 6200,
    marketDelta: 2.1,
    popularity: 81,
    accent: "from-blue-200 to-indigo-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp",
  },
  {
    id: "minase-five-windows",
    brand: "Minase",
    model: "Five Windows",
    reference: "VM03-R02SD",
    tier: "Mid",
    price: 4600,
    marketDelta: 2.2,
    popularity: 74,
    accent: "from-neutral-300 to-slate-700",
  },
  {
    id: "omega-speedmaster",
    brand: "Omega",
    model: "Speedmaster Moonwatch",
    reference: "310.30.42.50.01.001",
    tier: "High",
    price: 7300,
    marketDelta: 4.8,
    popularity: 97,
    accent: "from-zinc-300 to-zinc-800",
    imageUrl: "https://cdn.dummyjson.com/product-images/womens-watches/iwc-ingenieur-automatic-steel/1.webp",
  },
  {
    id: "rolex-submariner",
    brand: "Rolex",
    model: "Submariner Date",
    reference: "126610LN",
    tier: "High",
    price: 13850,
    marketDelta: 7.2,
    popularity: 99,
    accent: "from-lime-300 to-emerald-800",
    imageUrl: "https://cdn.dummyjson.com/product-images/womens-watches/rolex-cellini-moonphase/1.webp",
  },
  {
    id: "cartier-santos",
    brand: "Cartier",
    model: "Santos Medium",
    reference: "WSSA0029",
    tier: "High",
    price: 8150,
    marketDelta: 1.9,
    popularity: 86,
    accent: "from-neutral-300 to-stone-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/womens-watches/rolex-datejust-women/1.webp",
  },
  {
    id: "kurono-tokyo-reiwa",
    brand: "Kurono Tokyo",
    model: "Reiwa",
    reference: "KT-REIWA",
    tier: "High",
    price: 9800,
    marketDelta: 3.1,
    popularity: 78,
    accent: "from-violet-300 to-indigo-700",
  },
  {
    id: "vacheron-overseas",
    brand: "Vacheron Constantin",
    model: "Overseas 4520V",
    reference: "4520V/210A-B128",
    tier: "Haute",
    price: 31000,
    marketDelta: 2.6,
    popularity: 84,
    accent: "from-slate-300 to-slate-800",
    imageUrl: "https://cdn.dummyjson.com/product-images/womens-watches/watch-gold-for-women/1.webp",
  },
  {
    id: "audemars-royal-oak",
    brand: "Audemars Piguet",
    model: "Royal Oak Selfwinding",
    reference: "15510ST",
    tier: "Haute",
    price: 51200,
    marketDelta: 9.9,
    popularity: 90,
    accent: "from-amber-200 to-orange-700",
    imageUrl: "https://cdn.dummyjson.com/product-images/womens-watches/women%27s-wrist-watch/1.webp",
  },
  {
    id: "patek-nautilus",
    brand: "Patek Philippe",
    model: "Nautilus",
    reference: "5811/1G",
    tier: "Haute",
    price: 118000,
    marketDelta: 12.4,
    popularity: 92,
    accent: "from-sky-300 to-blue-900",
    imageUrl: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp",
  },
];
