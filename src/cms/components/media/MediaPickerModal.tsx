"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/cms/components/ui/dialog";
import { Button } from "@/cms/components/ui/button";
import { Skeleton } from "@/cms/components/ui/skeleton";
import {
  ImageIcon, Loader2, CheckCircle2, UploadCloud,
  AlertTriangle, Search, X, CircleAlert,
} from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt: string | null;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string | string[]) => void;
  multiSelect?: boolean;
}

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  oversized: boolean;
}

const PAGE_SIZE = 24;
const MAX_FILES = 12;
const WEB_OPTIMAL_BYTES = 500 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml",
];

/**
 * Image picker with library browsing and drag-and-drop upload. `onSelect` receives `/cms/...` URLs.
 * The body mounts fresh on every open, so selection and upload queue always start empty.
 */
export default function MediaPickerModal(props: MediaPickerModalProps) {
  return props.open ? <MediaPickerBody {...props} /> : null;
}

function MediaPickerBody({
  open,
  onClose,
  onSelect,
  multiSelect = false,
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async (pageNum: number, reset = false, q = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), type: "image" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/media?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setTotal(data.total);
      setPage(pageNum);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia(1, true, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, fetchMedia]);

  // ── Queue helpers ──────────────────────────────────────────────────────────

  function addFilesToQueue(files: FileList | File[]) {
    const valid = Array.from(files)
      .filter((f) => ALLOWED_TYPES.includes(f.type))
      .slice(0, MAX_FILES);
    if (valid.length === 0) return;

    setAllDone(false);
    setQueue((prev) => {
      const merged = [
        ...prev,
        ...valid.map((f) => ({
          id: crypto.randomUUID(),
          file: f,
          status: "pending" as UploadStatus,
          oversized: f.size > WEB_OPTIMAL_BYTES,
        })),
      ].slice(0, MAX_FILES);
      return merged;
    });
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  }

  async function processQueue() {
    setIsProcessing(true);
    const pending = queue.filter((i) => i.status === "pending");
    let lastUrl: string | null = null;
    let successCount = 0;
    let errorCount = 0;

    const toastId = toast.loading(`Uploading 0 / ${pending.length}…`);

    for (let idx = 0; idx < pending.length; idx++) {
      const item = pending[idx];
      toast.loading(`Uploading ${idx + 1} / ${pending.length}…`, { id: toastId });

      setQueue((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, status: "uploading" } : i)
      );
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("imagesOnly", "1");
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          lastUrl = url;
          successCount++;
          setQueue((prev) =>
            prev.map((i) => i.id === item.id ? { ...i, status: "done" } : i)
          );
        } else {
          errorCount++;
          toast.error(`Failed to upload "${item.file.name}"`);
          setQueue((prev) =>
            prev.map((i) => i.id === item.id ? { ...i, status: "error" } : i)
          );
        }
      } catch {
        errorCount++;
        toast.error(`Failed to upload "${item.file.name}"`);
        setQueue((prev) =>
          prev.map((i) => i.id === item.id ? { ...i, status: "error" } : i)
        );
      }
    }

    await fetchMedia(1, true, search);
    if (lastUrl) setSelected(lastUrl);
    setIsProcessing(false);
    setAllDone(true);

    if (errorCount === 0) {
      toast.success(`${successCount} image${successCount !== 1 ? "s" : ""} uploaded`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`All uploads failed`, { id: toastId });
    } else {
      toast.warning(`${successCount} uploaded, ${errorCount} failed`, { id: toastId });
    }

    setTimeout(() => {
      setAllDone(false);
      setQueue([]);
    }, 2500);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFilesToQueue(e.dataTransfer.files);
  }

  // ── Multi-select ──────────────────────────────────────────────────────────

  function handleSelect() {
    if (multiSelect) {
      if (selectedMultiple.size > 0) { onSelect(Array.from(selectedMultiple)); onClose(); }
    } else {
      if (selected) { onSelect(selected); onClose(); }
    }
  }

  function toggleMultiSelect(url: string) {
    setSelectedMultiple((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  const hasMore = items.length < total;
  const oversizedCount = queue.filter((i) => i.oversized).length;
  const pendingCount = queue.filter((i) => i.status === "pending").length;
  const doneCount = queue.filter((i) => i.status === "done").length;

  // ── Status icon per queue item ────────────────────────────────────────────

  function StatusIcon({ status }: { status: UploadStatus }) {
    if (status === "uploading") return <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />;
    if (status === "done")      return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
    if (status === "error")     return <CircleAlert className="w-4 h-4 text-destructive shrink-0" />;
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[70vw] max-w-[70vw] sm:max-w-[70vw] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className={`dark relative flex flex-col flex-1 overflow-hidden bg-background text-foreground rounded-[inherit]`}>
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* LEFT PANEL — Library */}
            <div className="flex-[3] flex flex-col overflow-hidden border-r border-border">
              <p className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-shrink-0">
                Media Library
              </p>
              <div className="px-4 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by filename…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {isLoading && items.length === 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                    <ImageIcon size={32} className="opacity-30" />
                    <span>No media uploaded yet.</span>
                    <span className="text-xs">Upload an image using the panel on the right.</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {items.map((item) => {
                        const isSelected = multiSelect
                          ? selectedMultiple.has(item.url)
                          : selected === item.url;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => multiSelect ? toggleMultiSelect(item.url) : setSelected(item.url)}
                            className={`group relative rounded-lg overflow-hidden border-2 transition focus:outline-none ${
                              isSelected ? "border-primary" : "border-transparent hover:border-border"
                            }`}
                          >
                            <div className="aspect-square bg-muted">
                              <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
                            </div>
                            <p className="px-1 py-0.5 text-[10px] text-muted-foreground truncate text-left">{item.filename}</p>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center mt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => fetchMedia(page + 1, false, search)} disabled={isLoading}>
                          {isLoading ? "Loading..." : "Load more"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT PANEL — Upload */}
            <div className="flex-[2] flex flex-col p-4 gap-3 overflow-hidden">
              <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Upload Images
                </p>
                {queue.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {queue.length} / {MAX_FILES}
                  </span>
                )}
              </div>

              {/* Drop zone — shown when queue is empty */}
              {queue.length === 0 && (
                <div
                  className={`flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition cursor-pointer ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <UploadCloud size={36} className="text-muted-foreground/50" />
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? "Drop to upload" : "Drag & drop images"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-3 opacity-60">
                      Up to {MAX_FILES} images at a time, 15 MB each · JPG PNG WebP GIF SVG
                    </p>
                  </div>
                </div>
              )}

              {/* Queue list — shown when files are added */}
              {queue.length > 0 && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  {/* Oversized warning */}
                  {oversizedCount > 0 && !isProcessing && !allDone && (
                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-600 dark:text-amber-400 flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {oversizedCount} file{oversizedCount > 1 ? "s" : ""} exceed 500 KB. Large images slow pages down: consider compressing them first (up to 15 MB is accepted).
                      </span>
                    </div>
                  )}

                  {/* Progress bar during upload */}
                  {isProcessing && (
                    <div className="space-y-1 flex-shrink-0">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading…</span>
                        <span className="tabular-nums">{doneCount} / {queue.length}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${queue.length > 0 ? (doneCount / queue.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* All done message */}
                  {allDone && (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-xs text-green-600 dark:text-green-400 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{doneCount} image{doneCount !== 1 ? "s" : ""} uploaded successfully!</span>
                    </div>
                  )}

                  {/* File list */}
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs ${
                          item.status === "done"      ? "border-green-500/30 bg-green-500/5"
                          : item.status === "error"   ? "border-destructive/30 bg-destructive/5"
                          : item.status === "uploading" ? "border-primary/40 bg-primary/5"
                          : "border-border bg-muted/20"
                        }`}
                      >
                        <StatusIcon status={item.status} />
                        {item.oversized && item.status === "pending" && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="flex-1 truncate text-foreground/80">{item.file.name}</span>
                        <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                          {(item.file.size / 1024).toFixed(0)} KB
                        </span>
                        {item.status === "pending" && !isProcessing && (
                          <button
                            type="button"
                            onClick={() => removeFromQueue(item.id)}
                            className="text-muted-foreground hover:text-foreground transition shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add more / Upload buttons */}
                  {!allDone && (
                    <div className="flex gap-2 flex-shrink-0">
                      {queue.length < MAX_FILES && !isProcessing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => uploadInputRef.current?.click()}
                        >
                          Add more
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1"
                        disabled={isProcessing || pendingCount === 0}
                        onClick={processQueue}
                      >
                        {isProcessing
                          ? `Uploading ${doneCount + 1}/${queue.length}…`
                          : `Upload ${pendingCount} image${pendingCount !== 1 ? "s" : ""}`}
                      </Button>
                    </div>
                  )}

                  {/* Drop zone below when queue is not full */}
                  {queue.length < MAX_FILES && !isProcessing && !allDone && (
                    <div
                      className={`h-14 flex items-center justify-center rounded-xl border-2 border-dashed transition cursor-pointer flex-shrink-0 ${
                        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      <p className="text-xs text-muted-foreground">
                        {isDragging ? "Drop to add" : `Drop more images (${MAX_FILES - queue.length} remaining)`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={uploadInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    addFilesToQueue(e.target.files);
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              disabled={multiSelect ? selectedMultiple.size === 0 : !selected}
              onClick={handleSelect}
            >
              {multiSelect ? `Confirm (${selectedMultiple.size})` : "Insert image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
