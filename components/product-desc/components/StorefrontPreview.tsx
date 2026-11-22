import { Package } from 'lucide-react';
import { useState } from 'react';
import type { GeneratedCatalogListing, UploadedProductImage } from '../shared/types';

interface StorefrontPreviewProps {
  listing: GeneratedCatalogListing;
  images: UploadedProductImage[];
}

export function StorefrontPreview({ listing, images }: StorefrontPreviewProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [brokenMap, setBrokenMap] = useState<Record<string, boolean>>({});
  const [bagCount, setBagCount] = useState(0);

  const activeImage = images[selectedImageIdx];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 text-xs text-zinc-500">
        <span>
          Storefront Preview · {listing.marketplaceListing.marketplaceLabel} Structure
        </span>
        <span className="font-mono tabular-nums">
          Bag ({bagCount})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
            {activeImage && !brokenMap[activeImage.id] ? (
              <img
                src={activeImage.dataUrl}
                alt={listing.seo.imageAltTexts[0] || listing.productName}
                referrerPolicy="no-referrer"
                onError={() =>
                  setBrokenMap((prev) => ({ ...prev, [activeImage.id]: true }))
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100 p-6 text-center">
                <Package className="h-8 w-8 text-zinc-400" />
                <span className="mt-2 text-xs font-medium text-zinc-600">
                  {listing.productName}
                </span>
                <span className="mt-1 text-[11px] text-zinc-400">
                  Upload a product photo to preview media
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`h-14 w-16 shrink-0 overflow-hidden rounded border ${
                    idx === selectedImageIdx ? 'border-zinc-900' : 'border-zinc-200'
                  }`}
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-500">
              {listing.brandName} · {listing.categoryLabel} / {listing.subcategory} ·{' '}
              <span className="font-mono">{listing.sku}</span>
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900 text-balance">
              {listing.marketplaceListing.title || listing.productName}
            </h3>
            {listing.price && (
              <div className="mt-2 font-mono text-lg font-semibold text-zinc-900 tabular-nums">
                {listing.price}
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-zinc-700">
              {listing.marketplaceListing.shortDescription || listing.shortDescription}
            </p>

            <div className="mt-5">
              <div className="text-xs font-semibold text-zinc-900">Key Highlights</div>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-700">
                {(listing.marketplaceListing.bulletPoints.length
                  ? listing.marketplaceListing.bulletPoints
                  : listing.bulletHighlights
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBagCount((c) => c + 1)}
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800"
              >
                Preview Add to Bag
              </button>
              <span className="text-xs text-zinc-500">
                /{listing.seo.urlSlug}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
            {listing.marketplaceListing.policyNotice}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-zinc-200 pt-6">
        <h4 className="font-display text-sm font-semibold text-zinc-900">
          Product Details &amp; Care
        </h4>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
          {listing.marketplaceListing.longDescription || listing.longDescription}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-xs font-semibold text-zinc-900">Verified Specifications</div>
            <dl className="mt-2 space-y-1.5 text-xs">
              {listing.categoryAttributes.slice(0, 8).map((attr) => (
                <div key={attr.key} className="flex justify-between gap-3 border-b border-zinc-100 pb-1">
                  <dt className="text-zinc-500">{attr.key}</dt>
                  <dd className="text-right font-medium text-zinc-900">{attr.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-xs font-semibold text-zinc-900">Care &amp; Storage</div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-700">
              {listing.careAndMaintenanceSummary}
            </p>
            <p className="mt-2 text-[11px] text-zinc-500">{listing.washCare.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
