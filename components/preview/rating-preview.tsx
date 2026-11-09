"use client"

import * as React from "react"
import { HeartIcon } from "lucide-react"

import { Rating } from "@/registry/default/ui/rating"

export function RatingPreview() {
  const [score, setScore] = React.useState(3.5)

  return (
    <div className="grid gap-4">
      <Rating
        aria-label="Your rating"
        value={score}
        onValueChange={setScore}
        step={0.5}
      />
      <Rating
        aria-label="How much you like it"
        defaultValue={4}
        icon={<HeartIcon />}
        className="text-destructive"
      />
    </div>
  )
}
