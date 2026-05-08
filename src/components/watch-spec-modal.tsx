"use client";

import Image from "next/image";
import { useEffect } from "react";
import { CURRENCY, percentage, type Watch, type WatchSpecs } from "@/lib/watches";

type Props = {
  open: boolean;
  watch: Watch | null;
  currentPrice?: number;
  specs: WatchSpecs | null;
  onClose: () => void;
};

export function WatchSpecModal({ open, watch, currentPrice, specs, onClose }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open || !watch || !specs) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-6" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-t-3xl border border-zinc-300 bg-white p-5 shadow-2xl md:rounded-3xl md:p-6 dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Spec Sheet</p>
            <h3 className="font-display text-3xl text-zinc-900 dark:text-zinc-50">{watch.brand} {watch.model}</h3>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{watch.reference}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative h-56 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70">
            {watch.imageUrl ? (
              <Image src={watch.imageUrl} alt={`${watch.brand} ${watch.model}`} fill className="object-contain" quality={95} />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${watch.accent}`} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SpecItem label="Tier" value={watch.tier} />
            <SpecItem label="Movement" value={specs.movement} />
            <SpecItem label="Case Size" value={specs.caseSize} />
            <SpecItem label="Water Resist" value={specs.waterResistance} />
            <SpecItem label="Power Reserve" value={specs.powerReserve} />
            <SpecItem label="Crystal" value={specs.crystal} />
            <SpecItem label="Lug to Lug" value={specs.lugToLug} />
            <SpecItem label="Strap" value={specs.strap} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SpecItem label="Current" value={CURRENCY.format(currentPrice ?? watch.price)} />
          <SpecItem label="Market Delta" value={`${percentage.format(watch.marketDelta)}%`} />
          <SpecItem label="Popularity" value={`${watch.popularity}/100`} />
        </div>
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </article>
  );
}
