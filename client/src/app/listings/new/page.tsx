"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/uploadImage";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X, Tag, Calendar, Camera, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["books", "electronics", "clothing", "furniture", "stationery", "sports", "accessories", "other"];
const CONDITIONS = [
  { value: "like-new", label: "Like New", desc: "Barely used", color: "bg-green-100 border-green-600 text-green-800" },
  { value: "good", label: "Good", desc: "Minor wear", color: "bg-blue-100 border-blue-600 text-blue-800" },
  { value: "fair", label: "Fair", desc: "Noticeable wear", color: "bg-yellow-100 border-yellow-600 text-yellow-800" },
  { value: "poor", label: "Poor", desc: "Heavy wear", color: "bg-red-100 border-red-600 text-red-800" },
];

export default function NewListingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([""]);
  const [priceReferenceLink, setPriceReferenceLink] = useState("");
  const [listingType, setListingType] = useState<"sell" | "rent">("sell");
  const [pricePerDay, setPricePerDay] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [maxRentalDays, setMaxRentalDays] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");

  // One hidden file input per image slot
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!user) {
    router.replace("/login");
    return null;
  }

  const addImage = () => { if (images.length < 5) setImages([...images, ""]); };
  const removeImage = (idx: number) => { setImages(images.filter((_, i) => i !== idx)); };
  const updateImage = (idx: number, val: string) => {
    const updated = [...images];
    updated[idx] = val;
    setImages(updated);
  };

  const handleCameraCapture = async (idx: number, file: File) => {
    if (!token) { toast.error("Sign in required"); return; }
    setUploadingIdx(idx);
    try {
      const url = await uploadImage(file, token);
      updateImage(idx, url);
      toast.success("Photo uploaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validImages = images.filter((img) => img.trim());
    if (validImages.length === 0) { toast.error("At least 1 image is required."); return; }
    if (!category) { toast.error("Please select a category."); return; }
    if (!condition) { toast.error("Please select a condition."); return; }
    if (listingType === "rent" && !pricePerDay) { toast.error("Enter rental price per day."); return; }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title,
        description,
        category,
        price: Number(price),
        condition,
        images: validImages,
        listingType,
        priceReferenceLink: priceReferenceLink || undefined,
      };
      if (listingType === "rent") {
        body.rentalDetails = {
          pricePerDay: Number(pricePerDay),
          depositAmount: depositAmount ? Number(depositAmount) : undefined,
          maxRentalDays: maxRentalDays ? Number(maxRentalDays) : undefined,
          availableFrom: availableFrom || undefined,
          availableTo: availableTo || undefined,
        };
      }
      const data = await api<any>("/listings", { method: "POST", body, token });
      toast.success("Listing published!");
      router.push(`/listings/${data.listing._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-[#555] hover:text-[#0a0a0a] mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-2xl font-black mb-5">Create Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Listing Type Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Tag className="w-4 h-4" /> Listing Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex border-2 border-[#0a0a0a] rounded-md overflow-hidden w-fit shadow-[3px_3px_0px_0px_#0a0a0a]">
                {(["sell", "rent"] as const).map((t, idx) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setListingType(t)}
                    aria-label={t === "sell" ? "Sell item" : "Rent out item"}
                    className={`px-6 py-2 text-sm font-black transition-colors ${idx > 0 ? "border-l-2 border-[#0a0a0a]" : ""}
                      ${listingType === t ? "bg-[#f5c518] text-[#0a0a0a]" : "bg-white text-[#555] hover:bg-[#f5f5f5]"}`}
                  >
                    {t === "sell" ? "📦 Sell" : "🔄 Rent Out"}
                  </button>
                ))}
              </div>
              {listingType === "rent" && (
                <p className="text-xs font-medium text-[#555] mt-2">
                  Rental listings show a purple RENT badge and include per-day pricing + deposit info.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="listing-title" className="text-xs font-black uppercase tracking-wide">Title *</label>
                <Input
                  id="listing-title"
                  placeholder="e.g. MTech Algorithms Textbook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={120}
                />
                <p className="text-xs text-[#888] text-right">{title.length}/120</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="listing-desc" className="text-xs font-black uppercase tracking-wide">Description *</label>
                <textarea
                  id="listing-desc"
                  placeholder="Edition, year, damage, accessories included…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={2000}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border-2 border-[#0a0a0a] text-sm resize-none focus:outline-none focus:shadow-none shadow-[3px_3px_0px_0px_#0a0a0a] focus:translate-x-[3px] focus:translate-y-[3px] transition-all bg-white font-medium"
                />
                <p className="text-xs text-[#888] text-right">{description.length}/2000</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="listing-category" className="text-xs font-black uppercase tracking-wide">Category *</label>
                  <select
                    id="listing-category"
                    title="Select item category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-md border-2 border-[#0a0a0a] text-sm shadow-[3px_3px_0px_0px_#0a0a0a] focus:outline-none focus:translate-x-[3px] focus:translate-y-[3px] focus:shadow-none transition-all bg-white font-bold capitalize appearance-none"
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="listing-price" className="text-xs font-black uppercase tracking-wide">
                    {listingType === "rent" ? "Deposit / Full Value (₹) *" : "Price (₹) *"}
                  </label>
                  <Input
                    id="listing-price"
                    type="number"
                    min={0}
                    placeholder="e.g. 350"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Details */}
          {listingType === "rent" && (
            <Card className="border-purple-500 shadow-[4px_4px_0px_0px_#7c3aed]">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                  <Calendar className="w-4 h-4" /> Rental Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="rent-perday" className="text-xs font-black uppercase tracking-wide">Price per Day (₹) *</label>
                    <Input
                      id="rent-perday"
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      required={listingType === "rent"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="rent-deposit" className="text-xs font-black uppercase tracking-wide">Deposit (₹)</label>
                    <Input
                      id="rent-deposit"
                      type="number"
                      min={0}
                      placeholder="Refundable deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="rent-maxdays" className="text-xs font-black uppercase tracking-wide">Max Rental Duration (days)</label>
                  <Input
                    id="rent-maxdays"
                    type="number"
                    min={1}
                    placeholder="e.g. 30"
                    value={maxRentalDays}
                    onChange={(e) => setMaxRentalDays(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="rent-from" className="text-xs font-black uppercase tracking-wide">Available From</label>
                    <Input id="rent-from" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="rent-to" className="text-xs font-black uppercase tracking-wide">Available To</label>
                    <Input id="rent-to" type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Condition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Condition *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-label={`Condition: ${c.label} — ${c.desc}`}
                    aria-pressed={condition === c.value}
                    onClick={() => setCondition(c.value)}
                    className={`flex flex-col items-start p-3 rounded-md border-2 transition-all text-left
                      ${condition === c.value
                        ? `${c.color} border-current shadow-[3px_3px_0px_0px_#0a0a0a] font-black`
                        : "bg-white border-[#0a0a0a] hover:bg-[#f5f5f5] shadow-[2px_2px_0px_0px_#0a0a0a]"
                      }`}
                  >
                    <span className="text-xs font-black">{c.label}</span>
                    <span className="text-[10px] font-medium text-current opacity-70">{c.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Images with Camera */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Photos * <span className="text-[#888] font-normal">(1–5, max 2 MB each)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {images.map((img, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    {/* Preview thumbnail */}
                    <div className="shrink-0 w-12 h-12 rounded-md border-2 border-[#0a0a0a] overflow-hidden bg-[#f5f5f5] flex items-center justify-center">
                      {img ? (
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#aaa] text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 flex gap-1.5">
                      {/* URL input */}
                      <Input
                        placeholder={`Paste URL or take photo…`}
                        value={img}
                        onChange={(e) => updateImage(idx, e.target.value)}
                        type="url"
                        aria-label={`Image ${idx + 1} URL`}
                        className="flex-1"
                      />

                      {/* Camera / file pick button */}
                      <div className="relative">
                        <input
                          ref={(el) => { fileInputRefs.current[idx] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="sr-only"
                          aria-label={`Take or choose photo ${idx + 1}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCameraCapture(idx, file);
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          title={`Take or choose photo ${idx + 1}`}
                          aria-label={`Take or choose photo ${idx + 1}`}
                          onClick={() => fileInputRefs.current[idx]?.click()}
                          disabled={uploadingIdx === idx}
                          className="w-9 h-9 flex items-center justify-center border-2 border-[#0a0a0a] rounded-md bg-white hover:bg-[#f5c518] shadow-[2px_2px_0px_0px_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                        >
                          {uploadingIdx === idx
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Camera className="w-4 h-4" />
                          }
                        </button>
                      </div>

                      {/* Remove button */}
                      {images.length > 1 && (
                        <button
                          type="button"
                          title={`Remove image ${idx + 1}`}
                          aria-label={`Remove image ${idx + 1}`}
                          onClick={() => removeImage(idx)}
                          className="w-9 h-9 flex items-center justify-center border-2 border-[#0a0a0a] rounded-md bg-white hover:bg-red-50 shadow-[2px_2px_0px_0px_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {images.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={addImage} className="gap-1.5 font-black">
                  <Plus className="w-3.5 h-3.5" /> Add Another Photo
                </Button>
              )}

              <div className="flex items-start gap-2 p-2 border border-[#e0e0e0] rounded-md bg-[#f9f9f9]">
                <Camera className="w-3.5 h-3.5 text-[#888] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[#666] font-medium">
                  Tap the camera icon to take a photo or pick from your gallery. On desktop, it opens your file browser.
                  Images are uploaded to free hosting (ImgBB). Max 2 MB per photo. Or paste any public image URL directly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Price reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Price Reference <span className="text-[#888] font-normal">(optional)</span></CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="url"
                placeholder="Amazon / Flipkart link for price comparison"
                value={priceReferenceLink}
                onChange={(e) => setPriceReferenceLink(e.target.value)}
                aria-label="Price reference link"
              />
              <p className="text-xs text-[#888] font-medium mt-1">Helps buyers verify your price is fair.</p>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading || uploadingIdx !== null}
            className="w-full font-black text-base py-6"
          >
            {loading ? "Publishing…" : listingType === "rent" ? "Publish Rental Listing" : "Publish Listing"}
          </Button>
        </form>
      </div>
    </div>
  );
}
