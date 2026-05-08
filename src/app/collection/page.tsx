"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WatchSpecModal } from "@/components/watch-spec-modal";
import {
  CURRENCY,
  EXTRA_WATCHES_KEY,
  OWNED_KEY,
  TRACKED_KEY,
  WATCH_CATALOG,
  getWatchSpecs,
  percentage,
  type OwnedWatch,
  type Watch,
} from "@/lib/watches";

export default function CollectionPage() {
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [owned, setOwned] = useState<OwnedWatch[]>([]);
  const [extraWatches, setExtraWatches] = useState<Watch[]>([]);
  const [trackedCount, setTrackedCount] = useState(0);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);

  useEffect(() => {
    const rawOwned = window.localStorage.getItem(OWNED_KEY);
    const rawExtraWatches = window.localStorage.getItem(EXTRA_WATCHES_KEY);
    const rawTracked = window.localStorage.getItem(TRACKED_KEY);

    setOwned(rawOwned ? JSON.parse(rawOwned) : []);
    setExtraWatches(rawExtraWatches ? JSON.parse(rawExtraWatches) : []);
    setTrackedCount(rawTracked ? (JSON.parse(rawTracked) as Array<{ watchId: string }>).length : 0);
    setStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    window.localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
  }, [owned, storageHydrated]);

  const allWatches = useMemo(() => [...WATCH_CATALOG, ...extraWatches], [extraWatches]);
  const watchById = useMemo(() => new Map(allWatches.map((watch) => [watch.id, watch])), [allWatches]);
  const resolvedPrice = (watch: Watch) => watch.price * (1 + watch.marketDelta / 100);

  const totalCurrentValue = useMemo(() => {
    return owned.reduce((sum, item) => {
      const watch = watchById.get(item.watchId);
      return watch ? sum + resolvedPrice(watch) : sum;
    }, 0);
  }, [owned, watchById]);

  const totalCostBasis = useMemo(() => {
    return owned.reduce((sum, item) => sum + item.purchasedPrice, 0);
  }, [owned]);

  const pnl = totalCostBasis > 0 ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100 : 0;

  const selectedWatchPrice = useMemo(() => {
    if (!selectedWatch) {
      return undefined;
    }

    return resolvedPrice(selectedWatch);
  }, [selectedWatch]);

  const selectedWatchSpecs = useMemo(() => {
    if (!selectedWatch) {
      return null;
    }

    return getWatchSpecs(selectedWatch);
  }, [selectedWatch]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(245,158,11,0.18),transparent_34%),radial-gradient(circle_at_90%_14%,rgba(16,185,129,0.16),transparent_36%)]" />

      <section className="relative mx-auto mb-8 max-w-7xl rounded-[2rem] border border-white/40 bg-white/75 p-6 shadow-[0_40px_120px_-45px_rgba(11,20,40,0.7)] backdrop-blur-xl md:p-10">
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800">
            Market
          </Link>
          <Link href="/tracker" className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800">
            Tracker
          </Link>
          <Link href="/collection" className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Collection
          </Link>
        </div>

        <h1 className="mt-5 font-display text-5xl text-zinc-900">Collection Vault</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-700 md:text-base">
          Your personal ownership dashboard with cost basis and live portfolio performance.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MiniStat label="Owned Watches" value={String(owned.length)} />
          <MiniStat label="Current Value" value={CURRENCY.format(totalCurrentValue)} />
          <MiniStat label="Cost Basis" value={CURRENCY.format(totalCostBasis)} />
          <MiniStat label="Unrealized P/L" value={`${percentage.format(pnl)}%`} />
        </div>

        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">{trackedCount} references currently in your tracker</p>
      </section>

      <section className="relative mx-auto max-w-7xl rounded-3xl border border-zinc-300/60 bg-white/85 p-5 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-3xl text-zinc-900">Owned Inventory</h2>

        <div className="space-y-3">
          {owned.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
              Your collection is empty. Add watches from the market page.
            </p>
          )}

          {owned.map((item) => {
            const watch = watchById.get(item.watchId);
            if (!watch) {
              return null;
            }

            const current = resolvedPrice(watch);
            const rowPnl = item.purchasedPrice > 0 ? ((current - item.purchasedPrice) / item.purchasedPrice) * 100 : 0;

            return (
              <div key={item.watchId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedWatch(watch)}
                    className="font-semibold text-zinc-900 transition hover:text-amber-600"
                  >
                    {watch.brand} {watch.model}
                  </button>
                  <span className={`text-sm font-semibold ${rowPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {percentage.format(rowPnl)}%
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Purchased</span>
                    <input
                      type="number"
                      value={item.purchasedPrice}
                      onChange={(event) => {
                        const purchasedPrice = Number(event.target.value) || 0;
                        setOwned((currentOwned) =>
                          currentOwned.map((ownedWatch) =>
                            ownedWatch.watchId === item.watchId ? { ...ownedWatch, purchasedPrice } : ownedWatch,
                          ),
                        );
                      }}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Current</span>
                    <input
                      value={CURRENCY.format(current)}
                      readOnly
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Purchase Date</span>
                    <input
                      type="date"
                      value={item.purchasedAt}
                      onChange={(event) => {
                        const purchasedAt = event.target.value;
                        setOwned((currentOwned) =>
                          currentOwned.map((ownedWatch) =>
                            ownedWatch.watchId === item.watchId ? { ...ownedWatch, purchasedAt } : ownedWatch,
                          ),
                        );
                      }}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="mt-2 block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Condition</span>
                  <select
                    value={item.condition}
                    onChange={(event) => {
                      const condition = event.target.value as OwnedWatch["condition"];
                      setOwned((currentOwned) =>
                        currentOwned.map((ownedWatch) =>
                          ownedWatch.watchId === item.watchId ? { ...ownedWatch, condition } : ownedWatch,
                        ),
                      );
                    }}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="Mint">Mint</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Worn">Worn</option>
                  </select>
                </label>
              </div>
            );
          })}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-zinc-300/60 bg-white p-4">
      <p className="text-[11px] uppercase tracking-[0.26em] text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </article>
  );
}
