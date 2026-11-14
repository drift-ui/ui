import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { examples } from "@/components/preview/examples/template-input"

function previews(id: string) {
  const example = examples.find((item) => item.id === id)!
  return [example.Preview, example.BasePreview!]
}

describe("TemplateInput examples", () => {
  it.each(previews("controlled"))(
    "keeps unknown and inherited names in the controlled preview",
    async (Preview) => {
      const user = userEvent.setup()
      render(<Preview />)
      const input = screen.getByRole("textbox", { name: "Email subject" })

      await user.clear(input)
      await user.type(input, "{{{{first_name}} {{{{toString}}")

      expect(screen.getByText("Preview: Noor {{toString}}")).toBeInTheDocument()
    }
  )

  it.each(previews("unknown-variables"))(
    "clears the warning once every variable is known",
    async (Preview) => {
      const user = userEvent.setup()
      render(<Preview />)
      const input = screen.getByRole("textbox", { name: "Webhook payload" })

      await user.clear(input)
      await user.type(input, "{{{{repo}}")

      expect(screen.getByText("Every variable is known.")).toBeInTheDocument()
      expect(input).toHaveAttribute("aria-invalid", "false")
    }
  )
})
