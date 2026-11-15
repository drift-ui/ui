import { HandInstallSteps } from "@/components/landing/hand-install-steps"
import { SectionHeading } from "@/components/landing/section-heading"

export function InstallSection() {
  return (
    <section
      id="install"
      className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-24 md:px-10 md:pb-36"
    >
      <SectionHeading
        title="Install with the shadcn CLI"
        lead="The @drift-ui namespace is built into the shadcn CLI, so there is nothing to register. Three steps in a project you already have."
      />
      <div className="mt-12 reveal md:mt-16">
        <HandInstallSteps />
      </div>
    </section>
  )
}
