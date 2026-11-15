"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { TagsInput } from "@/registry/default/ui/tags-input"
import { SectionHeading } from "@/components/landing/section-heading"
import { SlotPattern } from "@/components/landing/slot-pattern"
import { StylePicker } from "@/components/showcase/style-picker"
import { radiusScaleCss } from "@/components/theme-scope-style"
import { DEFAULT_STYLE, scopeStyleCss } from "@/lib/style-tokens"

const DEMO_SCOPE = ["[data-fit-demo]"]

const FACTS = [
  {
    term: "base-* styles",
    detail: "Get the Base UI build. radix-ui is never installed.",
  },
  {
    term: "Any other style",
    detail: "Gets the Radix build, new-york included.",
  },
  {
    term: "Shape tokens",
    detail: "Control height, corners and shadows follow the style you pick.",
  },
]

export function FitSection() {
  const [style, setStyle] = React.useState(DEFAULT_STYLE)

  return (
    <section
      id="fit"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 md:px-10 md:py-36"
    >
      <SectionHeading
        title="Fits the kit you already have"
        lead="Primitives keep the exact shadcn/ui API. Every component reads your color tokens, and the style in your components.json sets its shape. Pick one to see it."
      />
      <div className="mt-14 grid gap-8 md:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          <StylePicker
            value={style}
            onValueChange={setStyle}
            className="[&_[aria-pressed=true]]:border-brand [&_[aria-pressed=true]]:bg-brand/10"
          />
          <dl className="border-t text-sm">
            {FACTS.map((fact) => (
              <div
                key={fact.term}
                className="grid gap-1 border-b py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="font-medium">{fact.term}</dt>
                <dd className="text-muted-foreground">{fact.detail}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/themes"
            className="group flex w-fit items-center gap-1.5 text-sm font-medium text-brand"
          >
            Try every style with your colors
            <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="relative isolate grid min-w-0 place-items-center overflow-hidden rounded-3xl border border-brand/25 bg-brand-solid/[0.07] p-4 sm:p-10">
          <SlotPattern className="absolute inset-0 -z-10 size-full text-brand/15" />
          <style>
            {`${radiusScaleCss(DEMO_SCOPE)}\n${scopeStyleCss(style, DEMO_SCOPE)}`}
          </style>
          <Card data-fit-demo className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite teammates</CardTitle>
              <CardDescription>
                They get access to every project in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fit-emails">Emails</Label>
                <TagsInput
                  id="fit-emails"
                  defaultValue={["sana@acme.dev", "leo@acme.dev"]}
                  placeholder="Add email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fit-note">Message</Label>
                <Input id="fit-note" placeholder="Optional note" />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Send invites</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}
