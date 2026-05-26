import React, { useState, useCallback } from "react";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { APP_NAME } from "@/utils/keys";
import ImageInput from "../elements/forms/ImageInput";
import { useMessage } from "@/lib/MessageProvider";
import { EMatchStatus, IEventSponsor } from "@/types";
import { DEFAULT_SPONSOR } from "@/utils/constant";
import InputField from "../elements/forms/InputField";


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ISponsorManagerProps {
  defaultSponsor: boolean;
  sponsors: Omit<IEventSponsor, '_id' | 'event'>[];
  onDefaultSponsorToggle: (value: boolean) => void;
  onSetSponsors: React.Dispatch<React.SetStateAction<Omit<IEventSponsor, '_id' | 'event'>[]>>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Returns a stable object-URL for a Blob, or the Cloudinary ID as-is. */
function isCloudinaryId(logo: Blob | string): logo is string {
  return typeof logo === "string" && logo !== DEFAULT_SPONSOR;
}

// ─────────────────────────────────────────────
// Sub-component: sponsor card
// ─────────────────────────────────────────────

interface SponsorCardProps {
  entry: Omit<IEventSponsor, '_id' | 'event'>;
  objectUrl: string;       // pre-computed by parent — no URL.createObjectURL here
  onRemove: () => void;
}

function SponsorCard({ entry, objectUrl, onRemove }: SponsorCardProps) {
  const { company, logo } = entry;

  return (
    <li className="relative w-20">
      {isCloudinaryId(logo) ? (
        <CldImage
          width={100}
          height={100}
          src={logo}
          alt={company}
          className="w-full"
        />
      ) : (
        <Image
          width={100}
          height={100}
          src={objectUrl}
          alt={company}
          className="w-full"
          unoptimized // blob URLs aren't processed by Next.js image optimisation
        />
      )}

      <p className="text-xs text-center truncate">{company}</p>

      <button
        type="button"
        aria-label={`Remove ${company}`}
        className="absolute top-0 right-0"
        onClick={onRemove}
      >
        <img src="/icons/close.svg" className="w-5 h-5" alt="" />
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function SponsorManager({
  defaultSponsor,
  sponsors,
  onDefaultSponsorToggle,
  onSetSponsors
}: ISponsorManagerProps) {

  // Object-URL map: keyed by the Blob reference itself.
  // We store it in a plain Map (not a ref) because the render function
  // reads it synchronously — no need for useRef here.
  const [objectUrls] = useState<Map<Blob, string>>(() => new Map());

  const [isAdding, setIsAdding] = useState(false);
  const [draftCompany, setDraftCompany] = useState("");
  const [draftLogo, setDraftLogo] = useState<Blob | null>(null);

  const { setMessage } = useMessage();

  // ── Derived: object-URLs for current sponsor list ──

  /**
   * Returns a stable object-URL for a Blob entry.
   * Creates a new one only when the Blob is first seen.
   * Cloudinary entries return an empty string (unused).
   */
  function getObjectUrl(logo: Blob | string): string {
    if (logo === DEFAULT_SPONSOR) return DEFAULT_SPONSOR;
    if (isCloudinaryId(logo)) return logo; // not used as <img src> for Cloudinary
    if (!objectUrls.has(logo)) {
      objectUrls.set(logo, URL.createObjectURL(logo));
    }
    return objectUrls.get(logo)!;
  }

  // ── Handlers ────────────────────────────────

  const handleOpenForm = useCallback(() => {
    setDraftCompany("");
    setDraftLogo(null);
    setIsAdding(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsAdding(false);
  }, []);

  const handleSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Guard: both fields required (rule 3)
    if (!draftCompany.trim() || !draftLogo) {
      setMessage({ type: 'error', message: "Set logo and name both" });
      return;
    }

    const newSponsor = { company: draftCompany.trim(), logo: draftLogo };
    onSetSponsors((prev) => [...prev.filter(s => s.company !== newSponsor.company), newSponsor as Omit<IEventSponsor, '_id' | 'event'>]);

    setIsAdding(false);
  }

  // Remove by index — O(1) splice, avoids string comparison
  const handleRemove = useCallback((index: number) => {
    onSetSponsors((prev) => {
      const removed = prev[index];

      // Revoke object-URL if it was a local Blob to free memory
      if (!isCloudinaryId(removed.logo) && objectUrls.has(removed.logo)) {
        URL.revokeObjectURL(objectUrls.get(removed.logo)!);
        objectUrls.delete(removed.logo);
      }

      return prev.filter((_, i) => i !== index);
    });

  }, [objectUrls]);

  // ── Render ──────────────────────────────────

  return (
    <div className="w-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex justify-between w-full mt-4 items-center">
        <h3 className="text-2xl capitalize">Sponsors</h3>

        {!isAdding && (
          <button
            type="button"
            className="btn-info"
            onClick={handleOpenForm}
            aria-label="Add sponsor"
          >
            <Image
              height={50}
              width={50}
              className="w-4 h-4 svg-black ml-2"
              src="/icons/plus.svg"
              alt="Add"
            />
          </button>
        )}
      </div>


      {/* ── Sponsor list ── */}
      {sponsors.length > 0 && (
        <ul className="flex flex-wrap gap-4 mt-4">
          {defaultSponsor && <SponsorCard key="default-sponsor" entry={({ company: APP_NAME, logo: DEFAULT_SPONSOR })} onRemove={() => onDefaultSponsorToggle(false)} objectUrl={getObjectUrl(DEFAULT_SPONSOR)} />}
          {sponsors.map((entry, index) => (
            <SponsorCard
              key={index}
              entry={entry}
              objectUrl={getObjectUrl(entry.logo)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </ul>
      )}

      {/* ── Inline add-sponsor form ── */}
      {isAdding && (
        <div className="w-full">
          <h4 >New Sponsor</h4>

          <div className="grid grid-col-1 md:grid-cols-3 gap-x-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none p-2">
            {/* Company name */}
            <InputField
              type="text"
              name="company"
              // placeholder="Company name"
              value={draftCompany}
              onChange={(e) => setDraftCompany(e.target.value)}
              className="w-full p-2 rounded"
              required
            // autoFocus
            />

            {/* Logo — uses ImageInput so cropping / compression is handled there */}
            <ImageInput
              name="sponsor-logo"
              label="Sponsor Logo"
              aspectRatio="1:1"
              onFileChange={(blob) => setDraftLogo(blob)}
            />

            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-2 justify-end items-end mt-2">
              <button
                type="button"
                disabled={!draftCompany.trim() || !draftLogo}
                className="btn-info h-fit w-fit"
                onClick={handleSave}
              >
                Save Sponsor
              </button>
              <button
                type="button"
                className="btn-danger h-fit w-fit"
                onClick={handleCloseForm}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}