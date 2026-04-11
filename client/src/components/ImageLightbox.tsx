"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-md border-2 border-[#F1FAEE] bg-[#1D3557] text-[#F1FAEE] shadow-[2px_2px_0px_0px_#F1FAEE] hover:bg-[#E63946]"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt={alt || ""}
        className="max-h-[90vh] max-w-full object-contain rounded-md border-2 border-[#F1FAEE]"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
