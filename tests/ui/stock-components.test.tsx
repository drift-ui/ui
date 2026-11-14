import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

describe("Button", () => {
  it("applies variant and size classes", () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    )
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "bg-destructive",
      "h-control-sm"
    )
  })

  it.skipIf(process.env.UI_PRIMITIVES === "base")(
    "renders as a child element",
    () => {
      render(
        <Button asChild>
          <a href="https://ui.shadcn.com">Browse</a>
        </Button>
      )
      expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute(
        "data-slot",
        "button"
      )
    }
  )
})

describe("Badge", () => {
  it("renders the variant", () => {
    render(<Badge variant="outline">Beta</Badge>)
    expect(screen.getByText("Beta")).toHaveAttribute("data-slot", "badge")
  })
})

describe("Input and Label", () => {
  it("associates the label and passes aria-invalid through", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" aria-invalid />
      </>
    )
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })
})

describe("Card", () => {
  it("renders every slot", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>Pick a name.</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    for (const slot of [
      "card",
      "card-header",
      "card-title",
      "card-description",
      "card-content",
      "card-footer",
    ]) {
      expect(document.querySelector(`[data-slot=${slot}]`)).toBeInTheDocument()
    }
  })
})

describe("Dialog", () => {
  it("opens from the trigger and closes with the close button", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Edit profile</DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your name.</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole("button", { name: "Edit profile" }))
    expect(
      screen.getByRole("dialog", { name: "Edit profile" })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("Popover", () => {
  it("opens and closes with Escape", async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>
    )

    await user.click(screen.getByRole("button", { name: "Details" }))
    expect(screen.getByText("Popover body")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByText("Popover body")).toBeNull()
  })
})
