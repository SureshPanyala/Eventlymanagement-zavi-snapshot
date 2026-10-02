"use client";

import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";

/** File picker with a live preview, plus the existing image URL field. A chosen
 *  file wins over the URL when the form is saved. */
export default function ImageUploadField({
  fileName,
  urlName,
  defaultUrl,
  label,
  hint,
  round = false,
}: {
  fileName: string;
  urlName: string;
  defaultUrl: string;
  label: string;
  hint: string;
  round?: boolean;
}): JSX.Element {
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState(defaultUrl);
  const [tooBig, setTooBig] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? (url.trim() ? url.trim() : null);

  return (
    <div className="grid min-w-0 gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={
            round
              ? "relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface2 ring-1 ring-border"
              : "relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-surface2 ring-1 ring-border sm:w-56"
          }
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-textMuted">
              <Upload className="h-5 w-5" />
            </span>
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold transition hover:bg-surface2">
              <Upload className="h-4 w-4" /> {preview ? "Choose another" : "Upload image"}
              <input
                key={inputKey}
                type="file"
                name={fileName}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (preview) URL.revokeObjectURL(preview);
                  if (!f) return setPreview(null);
                  if (f.size > 3 * 1024 * 1024) {
                    setTooBig(true);
                    setPreview(null);
                    setInputKey((k) => k + 1);
                    return;
                  }
                  setTooBig(false);
                  setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
            {shown ? (
              <button
                type="button"
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(null);
                  setUrl("");
                  setInputKey((k) => k + 1);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-textMuted transition hover:bg-surface2 hover:text-text"
              >
                <X className="h-4 w-4" /> Remove
              </button>
            ) : null}
          </div>
          <input
            name={urlName}
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste an https:// image link"
            className="h-10 w-full min-w-0 rounded-xl border border-border bg-bg px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <span className={tooBig ? "text-xs font-medium text-red-700" : "text-xs text-textMuted"}>
            {tooBig ? "That file is over 3 MB. Choose a smaller image." : hint}
          </span>
        </div>
      </div>
    </div>
  );
}
