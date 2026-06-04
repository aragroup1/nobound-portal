"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Sparkles, TrendingUp, FileText, Link2, Check } from "lucide-react";
import { requestSeoUpgrade } from "./actions";

export function SeoUpsell() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleInterest() {
    setSubmitting(true);
    const res = await requestSeoUpgrade();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.message ?? "Couldn't send right now.");
      return;
    }
    setSubmitted(true);
    toast.success("Thanks — we'll be in touch within 24h.");
  }

  return (
    <Card className="mb-8 border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] to-primary/[0.06]">
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-emerald-500/15 p-3 shrink-0">
            <TrendingUp className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="flex-1">
            <div className="font-heading text-xl font-semibold">
              Want to grow with SEO?
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Your website is live — now let&apos;s get it found. Our SEO programme drives
              qualified organic traffic month after month so you stop relying on ads.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-heading text-2xl font-semibold">£100<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            <div className="text-xs text-muted-foreground">Added to your subscription</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" /> What&apos;s included
                </Button>
              }
            />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  SEO — what you get
                </DialogTitle>
                <DialogDescription>
                  £100 / month. Cancel anytime. First measurable improvements in ~60 days.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Feature
                  icon={<Search className="h-4 w-4" />}
                  title="Technical SEO audit, every month"
                  body="We check Core Web Vitals, indexability, broken links, schema markup, and crawl errors — and fix what's blocking you from ranking."
                />
                <Feature
                  icon={<FileText className="h-4 w-4" />}
                  title="One published content piece per month"
                  body="Targeted at a keyword we've identified as winnable for your business. Written by us, published on your site, ready to attract traffic."
                />
                <Feature
                  icon={<TrendingUp className="h-4 w-4" />}
                  title="Keyword tracking & monthly report"
                  body="We track your rankings for the keywords that actually move money. You get a one-page report each month showing what moved and why."
                />
                <Feature
                  icon={<Link2 className="h-4 w-4" />}
                  title="Link strategy"
                  body="Outreach plan + opportunities for high-authority backlinks from sites in your industry."
                />

                <div className="rounded-lg border border-border bg-background/40 p-4 text-sm space-y-2">
                  <div className="font-medium text-foreground">What SEO actually is</div>
                  <p className="text-muted-foreground">
                    Search Engine Optimisation is the work that gets your website found when
                    someone types something into Google related to what you sell. Done right,
                    it&apos;s a compounding marketing channel — traffic you don&apos;t pay for
                    every click, and a moat your competitors can&apos;t easily replicate.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Click &quot;I&apos;m interested&quot; below and we&apos;ll be in touch within 24 hours to confirm details
                  before adding it to your subscription.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {submitted ? (
            <Button variant="secondary" size="sm" disabled>
              <Check className="h-4 w-4" /> We&apos;ll be in touch
            </Button>
          ) : (
            <Button onClick={handleInterest} disabled={submitting} size="sm">
              {submitting ? "Sending…" : "I'm interested"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-emerald-500/10 text-emerald-300 p-1.5 mt-0.5 shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
