import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { QueryInputPreview as BaseUiQueryInputPreview } from "@/components/preview/base/query-input-preview"
import { examples } from "@/components/preview/examples/query-input"
import { QueryInputPreview } from "@/components/preview/query-input-preview"

function previews(id: string) {
  const example = examples.find((item) => item.id === id)!
  return [example.Preview, example.BasePreview!]
}

describe("QueryInput examples", () => {
  it.each([QueryInputPreview, BaseUiQueryInputPreview])(
    "filters the issue list and shows author names",
    async (Preview) => {
      const user = userEvent.setup()
      render(<Preview />)
      const input = screen.getByRole("combobox", { name: "Search issues" })

      expect(screen.getByText("Login page loops after SSO")).toBeInTheDocument()
      expect(screen.getByText("Noor Haddad")).toBeInTheDocument()

      await user.clear(input)
      await user.type(input, 'is:closed "login page"')
      expect(
        screen.getByText("Remember me checkbox on the login page")
      ).toBeInTheDocument()
      expect(
        screen.queryByText("Login page loops after SSO")
      ).not.toBeInTheDocument()

      await user.type(input, " nothing")
      expect(screen.getByText("No matching issues")).toBeInTheDocument()
    }
  )

  it.each(previews("with-filter-builder"))(
    "rewrites the query when a chip is removed",
    async (Preview) => {
      const user = userEvent.setup()
      render(<Preview />)
      const input = screen.getByRole("combobox", { name: "Search accounts" })

      await user.click(
        screen.getByRole("button", { name: "Remove Status filter" })
      )

      expect(input).toHaveValue("seats:>10 acme")
    }
  )
})
