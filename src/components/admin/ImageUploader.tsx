"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  folder?: string;
  subfolder?: string;
  previewHeight?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label,
  hint,
  folder = "editorial",
  subfolder,
  previewHeight = "h-32",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"url" | "upload">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("photos", files[0]);
    formData.append("folder", folder);
    formData.append("subfolder", subfolder || `upload-${Date.now()}`);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      onChange(data.urls[0]);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-dark-muted text-xs font-medium uppercase tracking-wider">
          {label}
          {hint && (
            <span className="ml-1 font-normal normal-case text-dark-muted">{hint}</span>
          )}
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`text-xs px-2 py-0.5 transition-colors ${
              mode === "url" ? "bg-brand text-white" : "text-dark-muted hover:text-dark-text"
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`text-xs px-2 py-0.5 transition-colors ${
              mode === "upload" ? "bg-brand text-white" : "text-dark-muted hover:text-dark-text"
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted"
        />
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-dashed border-dark-border bg-dark-bg hover:border-brand transition-colors cursor-pointer px-3 py-4 text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          {uploading ? (
            <p className="text-dark-muted text-sm">Uploading...</p>
          ) : (
            <>
              <p className="text-dark-muted text-sm">Click to browse or drag an image here</p>
              <p className="text-dark-muted text-xs mt-1">Max 10MB — JPG, PNG, WebP</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {value && (
        <div className={`mt-2 relative ${previewHeight} overflow-hidden border border-dark-border`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 hover:bg-brand transition-colors"
          >
            ✕ Remove
          </button>
        </div>
      )}
    </div>
  );
}
