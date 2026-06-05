"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Siren, Wrench, ImagePlus, X, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { raiseTicket, type RaiseState } from "./actions";

const initial: RaiseState = { ok: false };
const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per image
const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/heic"];

type Uploaded = { name: string; url: string; size: number };

export function RaiseForm() {
  const [state, action, pending] = useActionState(raiseTicket, initial);
  const [uploads, setUploads] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (uploads.length + files.length > MAX_FILES) {
      toast.error(`Up to ${MAX_FILES} images per ticket.`);
      return;
    }
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const newOnes: Uploaded[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) {
        toast.error(`${file.name}: not a supported image type.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: too large (max 8 MB).`);
        continue;
      }
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(path);
      newOnes.push({ name: file.name, url: pub.publicUrl, size: file.size });
    }

    setUploads((prev) => [...prev, ...newOnes]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeUpload(url: string) {
    setUploads((prev) => prev.filter((u) => u.url !== url));
  }

  return (
    <form action={action} className="space-y-5">
      {uploads.map((u) => (
        <input key={u.url} type="hidden" name="attachment_urls" value={u.url} />
      ))}

      <div className="space-y-2">
        <Label htmlFor="type">Request type</Label>
        <Select name="type" defaultValue="modification">
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modification">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div>Modification</div>
                  <div className="text-xs text-muted-foreground">
                    Standard change — copy, design, layout, content
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="emergency">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-rose-400" />
                <div>
                  <div>Emergency</div>
                  <div className="text-xs text-muted-foreground">
                    Site is broken or offline — we&apos;ll prioritise
                  </div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Update homepage hero copy" />
        {state.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">What needs to change?</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          required
          placeholder="Describe the change. Links welcome."
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">{state.fieldErrors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Screenshots (optional)</Label>
        <p className="text-xs text-muted-foreground -mt-1 mb-1">
          Attach up to {MAX_FILES} images showing where the change is needed. PNG, JPG, GIF, WEBP — 8 MB each.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {uploads.map((u) => (
            <div
              key={u.url}
              className="relative group rounded-lg border border-border bg-card overflow-hidden aspect-video"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.url} alt={u.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeUpload(u.url)}
                className="absolute top-1.5 right-1.5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground p-1 transition-colors"
                aria-label={`Remove ${u.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/95 to-transparent px-2 py-1 text-[10px] truncate">
                {u.name}
              </div>
            </div>
          ))}

          {uploads.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-video rounded-lg border-2 border-dashed border-border bg-card/50 hover:border-primary/50 hover:bg-card transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Add screenshot</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      <Button type="submit" disabled={pending || uploading} className="w-full">
        {pending ? "Submitting..." : "Submit request"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        We&apos;ll review and reply with a price within 24 hours.
      </p>
    </form>
  );
}
