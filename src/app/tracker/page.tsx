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
  type TrackedWatch,
  type Watch,
} from "@/lib/watches";

export default function TrackerPage() {
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [tracked, setTracked] = useState<TrackedWatch[]>([]);
  const [extraWatches, setExtraWatches] = useState<Watch[]>([]);
  const [inCollection, setInCollection] = useState(0);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);

  useEffect(() => {
    const rawTracked = window.localStorage.getItem(TRACKED_KEY);
    const rawExtraWatches = window.localStorage.getItem(EXTRA_WATCHES_KEY);
    const rawOwned = window.localStorage.getItem(OWNED_KEY);

    setTracked(rawTracked ? JSON.parse(rawTracked) : []);
    setExtraWatches(rawExtraWatches ? JSON.parse(rawExtraWatches) : []);
    setInCollection(rawOwned ? (JSON.parse(rawOwned) as Array<{ watchId: string }>).length : 0);
    setStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    window.localStorage.setItem(TRACKED_KEY, JSON.stringify(tracked));
  }, [storageHydrated, tracked]);

  const allWatches = useMemo(() => [...WATCH_CATALOG, ...extraWatches], [extraWatches]);
  const watchById = useMemo(() => new Map(allWatches.map((watch) => [watch.id, watch])), [allWatches]);

  const resolvedPrice = (watch: Watch) => watch.price * (1 + watch.marketDelta / 100);

  const activeTargets = useMemo(() => {
    return tracked.filter((item) => {
      const watch = watchById.get(item.watchId);
      return Boolean(watch && resolvedPrice(watch) > item.targetPrice);
    }).length;
  }, [tracked, watchById]);

  const totalTargetValue = useMemo(() => {
    return tracked.reduce((sum, item) => sum + item.targetPrice, 0);
  }, [tracked]);

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_88%_8%,rgba(245,158,11,0.18),transparent_35%)]" />

      <section className="relative mx-auto mb-8 max-w-7xl rounded-[2rem] border border-white/40 bg-white/75 p-6 shadow-[0_40px_120px_-45px_rgba(11,20,40,0.7)] backdrop-blur-xl md:p-10">
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800">
            Market
          </Link>
          <Link href="/tracker" className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Tracker
          </Link>
          <Link href="/collection" className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800">
            Collection
          </Link>
        </div>

        <h1 className="mt-5 font-display text-5xl text-zinc-900">Tracker Hub</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-700 md:text-base">
          Personal target board for every watch you are actively hunting.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MiniStat label="Tracked Watches" value={String(tracked.length)} />
          <MiniStat label="Open Targets" value={String(activeTargets)} />
          <MiniStat label="Target Budget" value={CURRENCY.format(totalTargetValue)} />
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl rounded-3xl border border-zinc-300/60 bg-white/85 p-5 backdrop-blur-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-3xl text-zinc-900">Tracking List</h2>
          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-700">
            {inCollection} owned in vault
          </span>
        </div>

        <div className="space-y-3">
          {tracked.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
              No tracked watches yet. Add watches from the market page.
            </p>
          )}

          {tracked.map((item) => {
            const watch = watchById.get(item.watchId);
            if (!watch) {
              return null;
            }

            const current = resolvedPrice(watch);
            const hitTarget = current <= item.targetPrice;

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
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${hitTarget ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                    {hitTarget ? "Target Hit" : "Watching"}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Target</span>
                    <input
                      type="number"
                      value={item.targetPrice}
                      onChange={(event) => {
                        const targetPrice = Number(event.target.value) || 0;
                        setTracked((currentTracked) =>
                          currentTracked.map((trackedWatch) =>
                            trackedWatch.watchId === item.watchId ? { ...trackedWatch, targetPrice } : trackedWatch,
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
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Market Delta</span>
                    <input
                      value={`${percentage.format(watch.marketDelta)}%`}
                      readOnly
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
                    />
                  </label>
                </div>

                <label className="mt-2 block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Note</span>
                  <input
                    value={item.note}
                    onChange={(event) => {
                      const note = event.target.value;
                      setTracked((currentTracked) =>
                        currentTracked.map((trackedWatch) =>
                          trackedWatch.watchId === item.watchId ? { ...trackedWatch, note } : trackedWatch,
                        ),
                      );
                    }}
                    placeholder="Dealer, bracelet preference, timing..."
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
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
