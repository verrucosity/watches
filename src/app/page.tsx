"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { WatchSpecModal } from "@/components/watch-spec-modal";
import {
  CURRENCY,
  EXTRA_WATCHES_KEY,
  OWNED_KEY,
  TRACKED_KEY,
  WATCH_CATALOG,
  getWatchSpecs,
  hashNumber,
  percentage,
  tierOrder,
  type OwnedWatch,
  type Tier,
  type TrackedWatch,
  type Watch,
} from "@/lib/watches";

export default function Home() {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "All">("All");
  const [maxBudget, setMaxBudget] = useState(40000);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [extraWatches, setExtraWatches] = useState<Watch[]>([]);
  const [apiResults, setApiResults] = useState<Watch[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [tracked, setTracked] = useState<TrackedWatch[]>([]);
  const [owned, setOwned] = useState<OwnedWatch[]>([]);
  const [priceDrift, setPriceDrift] = useState<Record<string, number>>({});

  const allWatches = useMemo(() => {
    return [...WATCH_CATALOG, ...extraWatches];
  }, [extraWatches]);

  useEffect(() => {
    const cachedExtraWatches = window.localStorage.getItem(EXTRA_WATCHES_KEY);
    const cachedTracked = window.localStorage.getItem(TRACKED_KEY);
    const cachedOwned = window.localStorage.getItem(OWNED_KEY);

    setExtraWatches(cachedExtraWatches ? JSON.parse(cachedExtraWatches) : []);
    setTracked(cachedTracked ? JSON.parse(cachedTracked) : []);
    setOwned(cachedOwned ? JSON.parse(cachedOwned) : []);
    setStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    window.localStorage.setItem(TRACKED_KEY, JSON.stringify(tracked));
  }, [storageHydrated, tracked]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    window.localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
  }, [owned, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    window.localStorage.setItem(EXTRA_WATCHES_KEY, JSON.stringify(extraWatches));
  }, [extraWatches, storageHydrated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPriceDrift((previous) => {
        const next: Record<string, number> = { ...previous };

        for (const watch of allWatches) {
          const current = previous[watch.id] ?? 0;
          const nudge = ((hashNumber(watch.id + String(Date.now())) % 14) - 7) / 1000;
          next[watch.id] = Math.max(Math.min(current + nudge, 0.12), -0.1);
        }

        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [allWatches]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setApiLoading(true);
      setApiError(null);

      try {
        const response = await fetch(`/api/watch-search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Live API request failed (${response.status})`);
        }

        const payload = (await response.json()) as { watches?: Watch[] };
        setApiResults(payload.watches ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setApiError("Live API is currently unavailable.");
        setApiResults([]);
      } finally {
        setApiLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const resolvedPrice = useCallback((watch: Watch) => {
    const extra = priceDrift[watch.id] ?? 0;
    return watch.price * (1 + watch.marketDelta / 100 + extra);
  }, [priceDrift]);

  const watchById = useMemo(() => {
    return new Map(allWatches.map((watch) => [watch.id, watch]));
  }, [allWatches]);

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allWatches.filter((watch) => {
      const matchesSearch =
        normalized.length === 0 ||
        `${watch.brand} ${watch.model} ${watch.reference}`
          .toLowerCase()
          .includes(normalized);

      const matchesTier = tierFilter === "All" || watch.tier === tierFilter;
      const withinBudget = resolvedPrice(watch) <= maxBudget;

      return matchesSearch && matchesTier && withinBudget;
    }).sort((a, b) => resolvedPrice(a) - resolvedPrice(b));
  }, [allWatches, maxBudget, query, resolvedPrice, tierFilter]);

  const marketStats = useMemo(() => {
    const catalogValue = allWatches.reduce((sum, watch) => sum + resolvedPrice(watch), 0);
    const trackedValue = tracked.reduce((sum, item) => {
      const watch = watchById.get(item.watchId);
      return watch ? sum + resolvedPrice(watch) : sum;
    }, 0);
    const ownedValue = owned.reduce((sum, item) => {
      const watch = watchById.get(item.watchId);
      return watch ? sum + resolvedPrice(watch) : sum;
    }, 0);
    return { catalogValue, trackedValue, ownedValue };
  }, [allWatches, owned, resolvedPrice, tracked, watchById]);

  const tierRadar = useMemo(() => {
    return ["Entry", "Mid", "High", "Haute"].map((tier) => {
      const inTier = allWatches.filter((watch) => watch.tier === tier);
      if (inTier.length === 0) {
        return {
          tier,
          avg: 0,
        };
      }
      const avg = inTier.reduce((sum, watch) => sum + resolvedPrice(watch), 0) / inTier.length;
      return {
        tier,
        avg,
      };
    });
  }, [allWatches, resolvedPrice]);

  const selectedWatchPrice = useMemo(() => {
    if (!selectedWatch) {
      return undefined;
    }

    return resolvedPrice(selectedWatch);
  }, [resolvedPrice, selectedWatch]);

  const selectedWatchSpecs = useMemo(() => {
    if (!selectedWatch) {
      return null;
    }

    return getWatchSpecs(selectedWatch);
  }, [selectedWatch]);

  const ensureWatchAvailable = useCallback((watch: Watch) => {
    if (WATCH_CATALOG.some((item) => item.id === watch.id)) {
      return;
    }

    setExtraWatches((current) => {
      if (current.some((item) => item.id === watch.id)) {
        return current;
      }

      return [...current, watch];
    });
  }, []);

  const addToTracker = (watch: Watch) => {
    ensureWatchAvailable(watch);

    setTracked((current) => {
      if (current.some((item) => item.watchId === watch.id)) {
        return current;
      }

      return [
        ...current,
        {
          watchId: watch.id,
          targetPrice: Math.round(resolvedPrice(watch) * 0.92),
          note: "",
        },
      ];
    });
  };

  const addToCollection = (watch: Watch) => {
    ensureWatchAvailable(watch);

    setOwned((current) => {
      if (current.some((item) => item.watchId === watch.id)) {
        return current;
      }

      return [
        ...current,
        {
          watchId: watch.id,
          purchasedPrice: Math.round(resolvedPrice(watch) * 0.85),
          purchasedAt: new Date().toISOString().split("T")[0],
          condition: "Excellent",
        },
      ];
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(249,115,22,0.12),transparent_40%)]" />

      <section className="relative mx-auto mb-8 max-w-7xl rounded-[2rem] border border-white/40 bg-white/70 p-6 shadow-[0_40px_120px_-45px_rgba(11,20,40,0.7)] backdrop-blur-xl md:p-10">
        <p className="mb-2 tracking-[0.35em] text-xs uppercase text-zinc-600">ChronoVault Market Terminal</p>
        <h1 className="font-display text-4xl leading-tight text-zinc-900 md:text-6xl">
          Track Watch Prices from Street Legends to Haute Icons
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-zinc-700 md:text-base">
          Search across curated references, add models to your live tracker, and maintain a separate portfolio for watches you already own.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
          >
            Market
          </Link>
          <Link
            href="/tracker"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800 hover:bg-zinc-100"
          >
            Tracker Hub
          </Link>
          <Link
            href="/collection"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800 hover:bg-zinc-100"
          >
            Collection Vault
          </Link>
          <ThemeToggle />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Curated Market" value={CURRENCY.format(marketStats.catalogValue)} tone="warm" />
          <StatCard label="Tracked Allocation" value={CURRENCY.format(marketStats.trackedValue)} tone="cold" />
          <StatCard label="Collection Live Value" value={CURRENCY.format(marketStats.ownedValue)} tone="forest" />
        </div>
      </section>

      <section className="relative mx-auto mb-8 max-w-7xl rounded-3xl border border-zinc-300/50 bg-white/80 p-5 shadow-[0_30px_80px_-45px_rgba(24,24,27,0.5)] backdrop-blur-md md:p-7">
        <div className="grid gap-4 lg:grid-cols-12">
          <label className="lg:col-span-6">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Search References</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rolex, Speedmaster, 15510ST..."
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </label>

          <label className="lg:col-span-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Tier</span>
            <select
              value={tierFilter}
              onChange={(event) => setTierFilter(event.target.value as Tier | "All")}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            >
              {tierOrder.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Max Price {CURRENCY.format(maxBudget)}
            </span>
            <input
              type="range"
              min={50}
              max={130000}
              step={50}
              value={maxBudget}
              onChange={(event) => setMaxBudget(Number(event.target.value))}
              className="h-12 w-full"
            />
          </label>
        </div>
      </section>

      <section className="relative mx-auto mb-10 max-w-7xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl text-zinc-900">Market Catalog</h2>
          <span className="rounded-full border border-zinc-300 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-600">
            {filteredCatalog.length} visible
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCatalog.map((watch) => {
            const currentPrice = resolvedPrice(watch);
            const alreadyTracked = tracked.some((item) => item.watchId === watch.id);
            const alreadyOwned = owned.some((item) => item.watchId === watch.id);

            return (
              <article
                key={watch.id}
                onClick={() => setSelectedWatch(watch)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedWatch(watch);
                  }
                }}
                role="button"
                tabIndex={0}
                className="group rounded-3xl border border-zinc-300/60 bg-white/85 p-5 shadow-[0_20px_40px_-28px_rgba(24,24,27,0.7)] backdrop-blur-sm transition hover:-translate-y-1"
              >
                <div className="relative mb-4 h-56 overflow-hidden rounded-2xl border border-zinc-200">
                  {watch.imageUrl ? (
                    <Image
                      src={watch.imageUrl}
                      alt={`${watch.brand} ${watch.model}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      quality={95}
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${watch.accent}`} />
                  )}
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent p-3 text-white">
                    <p className="text-xs uppercase tracking-[0.25em] opacity-90">{watch.tier}</p>
                    <p className="mt-1 font-display text-xl">{watch.brand}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-zinc-900">{watch.model}</h3>
                <p className="text-xs tracking-[0.22em] text-zinc-500 uppercase">{watch.reference}</p>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xl font-semibold text-zinc-900">{CURRENCY.format(currentPrice)}</p>
                  <p className={`text-sm font-semibold ${watch.marketDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {percentage.format(watch.marketDelta)}%
                  </p>
                </div>

                <Sparkline watchId={watch.id} delta={watch.marketDelta} />

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToTracker(watch);
                    }}
                    disabled={alreadyTracked}
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {alreadyTracked ? "Tracked" : "Add to Tracker"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCollection(watch);
                    }}
                    disabled={alreadyOwned}
                    className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {alreadyOwned ? "In Collection" : "I Own This"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto mb-10 max-w-7xl rounded-3xl border border-zinc-300/60 bg-white/85 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl text-zinc-900">Live API Feed</h2>
          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-700">
            query: {query.trim() || "none"}
          </span>
        </div>

        <p className="mb-5 text-sm text-zinc-600">
          Results stream from a live external API through your Next.js route handler, then can be added to your tracker or collection.
        </p>

        {apiLoading && (
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            Loading live watch results...
          </p>
        )}

        {!apiLoading && query.trim().length >= 2 && apiError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {apiError}
          </p>
        )}

        {!apiLoading && !apiError && query.trim().length < 2 && (
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            Type at least 2 characters in search to load live API watches.
          </p>
        )}

        {!apiLoading && !apiError && query.trim().length >= 2 && apiResults.length === 0 && (
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            No live watches returned for this query.
          </p>
        )}

        {apiResults.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {apiResults.map((watch) => {
              const alreadyTracked = tracked.some((item) => item.watchId === watch.id);
              const alreadyOwned = owned.some((item) => item.watchId === watch.id);

              return (
                <article
                  key={watch.id}
                  onClick={() => setSelectedWatch(watch)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedWatch(watch);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="rounded-3xl border border-zinc-300/60 bg-white p-5 shadow-[0_20px_40px_-28px_rgba(24,24,27,0.7)]"
                >
                  <div className="relative mb-3 h-52 overflow-hidden rounded-2xl border border-zinc-200">
                    {watch.imageUrl ? (
                      <Image
                        src={watch.imageUrl}
                        alt={`${watch.brand} ${watch.model}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        quality={95}
                      />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${watch.accent}`} />
                    )}
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent p-3 text-white">
                      <p className="text-[11px] uppercase tracking-[0.2em]">Live API</p>
                      <p className="font-display text-lg">{watch.brand}</p>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-900">{watch.model}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{watch.reference}</p>
                  <p className="mt-2 text-xl font-semibold text-zinc-900">{CURRENCY.format(watch.price)}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        addToTracker(watch);
                      }}
                      disabled={alreadyTracked}
                      className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                      {alreadyTracked ? "Tracked" : "Track"}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        addToCollection(watch);
                      }}
                      disabled={alreadyOwned}
                      className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                      {alreadyOwned ? "Owned" : "Add Owned"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="relative mx-auto mb-10 grid max-w-7xl gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-zinc-300/60 bg-white/85 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Personal Area</p>
          <h2 className="mt-2 font-display text-4xl text-zinc-900">Tracker Hub</h2>
          <p className="mt-2 text-sm text-zinc-600">Fine-tune targets, notes, and alert readiness in your dedicated tracker workspace.</p>
          <p className="mt-6 text-3xl font-semibold text-zinc-900">{tracked.length}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active watch targets</p>
          <Link
            href="/tracker"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-zinc-700"
          >
            Open Tracker Page
          </Link>
        </article>

        <article className="rounded-3xl border border-zinc-300/60 bg-white/85 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Personal Area</p>
          <h2 className="mt-2 font-display text-4xl text-zinc-900">Collection Vault</h2>
          <p className="mt-2 text-sm text-zinc-600">Manage ownership details and monitor unrealized performance in a private vault experience.</p>
          <p className="mt-6 text-3xl font-semibold text-zinc-900">{owned.length}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Owned references</p>
          <Link
            href="/collection"
            className="mt-6 inline-flex rounded-xl bg-amber-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 hover:bg-amber-400"
          >
            Open Collection Page
          </Link>
        </article>
      </section>

      <section className="relative mx-auto max-w-7xl rounded-3xl border border-zinc-300/50 bg-white/80 p-5 backdrop-blur-sm md:p-6">
        <h2 className="font-display text-3xl text-zinc-900">Tier Radar</h2>
        <p className="mb-5 text-sm text-zinc-600">Average live price by segment, refreshed with market drift.</p>
        <div className="grid gap-4 md:grid-cols-4">
          {tierRadar.map((band) => (
            <div key={band.tier} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{band.tier}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{CURRENCY.format(band.avg)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-sky-500"
                  style={{ width: `${Math.min((band.avg / 130000) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <WatchSpecModal
        open={selectedWatch !== null}
        watch={selectedWatch}
        currentPrice={selectedWatchPrice}
        specs={selectedWatchSpecs}
        onClose={() => setSelectedWatch(null)}
      />
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "warm" | "cold" | "forest";
}) {
  const classes = {
    warm:
      "from-amber-200 via-orange-100 to-amber-50 dark:from-amber-950 dark:via-amber-900 dark:to-orange-950",
    cold:
      "from-sky-200 via-blue-100 to-sky-50 dark:from-slate-950 dark:via-blue-950 dark:to-sky-950",
    forest:
      "from-emerald-200 via-green-100 to-emerald-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950",
  };

  return (
    <article
      className={`rounded-2xl border border-white/60 bg-gradient-to-br p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-slate-700/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_-24px_rgba(2,6,23,0.95)] ${classes[tone]}`}
    >
      <p className="text-[11px] uppercase tracking-[0.26em] text-zinc-600 [text-shadow:0_1px_0_rgba(255,255,255,0.35)] dark:text-slate-300 dark:[text-shadow:none]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950 [text-shadow:0_1px_0_rgba(255,255,255,0.35)] dark:text-white dark:[text-shadow:0_2px_12px_rgba(15,23,42,0.55)]">
        {value}
      </p>
    </article>
  );
}

function Sparkline({ watchId, delta }: { watchId: string; delta: number }) {
  const base = hashNumber(watchId);
  const points = Array.from({ length: 14 }, (_, i) => {
    const drift = Math.sin((base + i * 17) / 15) * 4;
    return Math.round(Math.max(10, Math.min(95, 50 + drift + delta * 2)));
  });

  return (
    <div className="mt-3 flex h-8 items-end gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1">
      {points.map((point, i) => (
        <span
          key={`${watchId}-${i}`}
          className="w-full rounded-sm bg-gradient-to-t from-zinc-800 to-zinc-500"
          style={{ height: `${point}%` }}
        />
      ))}
    </div>
  );
}
