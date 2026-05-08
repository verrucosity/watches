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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 md:items-center md:p-6" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-3xl border border-zinc-300 bg-white shadow-2xl overscroll-contain dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spec-modal-header sticky top-0 z-10 mb-4 border-b border-zinc-300/80 bg-slate-50/95 p-4 backdrop-blur-sm md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="spec-modal-header__meta text-xs uppercase tracking-[0.2em] text-[rgb(82,82,91)]">Spec Sheet</p>
              <h3 className="spec-modal-header__title font-display text-3xl leading-tight text-[rgb(24,24,27)]">{watch.brand} {watch.model}</h3>
              <p className="spec-modal-header__meta text-xs uppercase tracking-[0.18em] text-[rgb(82,82,91)]">{watch.reference}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close spec sheet"
              className="spec-modal-header__close inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-400 text-xl leading-none text-[rgb(63,63,70)] hover:bg-zinc-100"
            >
              x
            </button>
          </div>
          <p className="spec-modal-header__meta mt-2 text-xs text-[rgb(82,82,91)]">Tap outside the sheet or use the X to close.</p>
        </div>

        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative h-56 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70">
              {watch.imageUrl ? (
                <Image
                  src={watch.imageUrl}
                  alt={`${watch.brand} ${watch.model}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={95}
                />
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
