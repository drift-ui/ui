import { SavedViewsAsyncStoragePreview } from "@/components/preview/examples/saved-views/async-storage"
import { SavedViewsControlledPreview } from "@/components/preview/examples/saved-views/controlled"
import { SavedViewsDirtyTrackingPreview } from "@/components/preview/examples/saved-views/dirty-tracking"
import { SavedViewsSelectVariantPreview } from "@/components/preview/examples/saved-views/select-variant"
import { SavedViewsUrlStatePreview } from "@/components/preview/examples/saved-views/url-state"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled views",
    description:
      "Manage views and activeId with React state to synchronize view selection with URL query parameters or backend storage.",
    Preview: SavedViewsControlledPreview,
  },
  {
    id: "dirty-tracking",
    title: "Dirty tracking",
    description:
      "Pass currentData and the component compares it with the active view's data. Key order and undefined fields are not changes. Pass isEqual for a different rule.",
    Preview: SavedViewsDirtyTrackingPreview,
  },
  {
    id: "url-state",
    title: "Active view in the URL",
    description:
      "readViewParam and writeViewParam map ?view= to an active id and back, keeping other params. Feed them from your router's search params.",
    Preview: SavedViewsUrlStatePreview,
  },
  {
    id: "async-storage",
    title: "Server storage with rollback",
    description:
      "Return a Promise from onCreate, onRename, onDuplicate, onDelete, onSetDefault or onSave. The view shows as pending, and a rejected request undoes the change and shows an error.",
    Preview: SavedViewsAsyncStoragePreview,
  },
  {
    id: "select-variant",
    title: "Select dropdown variant",
    description:
      "variant='select' provides a compact dropdown trigger for toolbars with limited horizontal space.",
    Preview: SavedViewsSelectVariantPreview,
  },
]
