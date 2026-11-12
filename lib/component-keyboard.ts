export type KeyBinding = { keys: string[]; action: string }

const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
const UP_DOWN = ["ArrowUp", "ArrowDown"]
const LEFT_RIGHT = ["ArrowLeft", "ArrowRight"]
const HOME_END = ["Home", "End"]
const PAGE = ["PageUp", "PageDown"]

export const COMPONENT_KEYBOARD: Record<string, KeyBinding[]> = {
  "activity-heatmap": [
    { keys: ARROWS, action: "Move through the calendar grid" },
    { keys: HOME_END, action: "First or last week in the row" },
    { keys: ["Enter", "Space"], action: "Select the focused day" },
    { keys: ["Escape"], action: "Dismiss the hover or focus tooltip" },
  ],
  "bulk-action-bar": [
    { keys: LEFT_RIGHT, action: "Move between actions" },
    { keys: ["Escape"], action: "Clear the selection" },
  ],
  "color-picker": [
    { keys: ARROWS, action: "Adjust saturation and brightness" },
    { keys: ["Shift"], action: "Hold for larger steps" },
    { keys: ["Enter"], action: "Apply a typed hex value" },
  ],
  "comment-thread": [
    { keys: ["Mod+Enter"], action: "Post, or save an edit" },
    { keys: ["Escape"], action: "Cancel a reply, edit or delete" },
  ],
  "csv-importer": [
    { keys: ["Enter", "Space"], action: "Upload file or advance step" },
    { keys: ["Tab"], action: "Move between mapping selectors and table cells" },
    { keys: ["Escape"], action: "Cancel or reset current step" },
  ],
  "duration-input": [
    { keys: UP_DOWN, action: "Step the focused unit" },
    { keys: PAGE, action: "Step by ten" },
    { keys: HOME_END, action: "Jump to the unit's min or max" },
    { keys: LEFT_RIGHT, action: "Move between units" },
    { keys: ["Backspace"], action: "Clear the unit" },
  ],
  "emoji-picker": [
    { keys: ARROWS, action: "Move through the grid" },
    { keys: HOME_END, action: "First or last emoji in the row" },
    { keys: PAGE, action: "Previous or next category" },
    { keys: ["Enter", "Space"], action: "Pick the focused emoji" },
  ],
  "image-cropper": [
    { keys: ARROWS, action: "Pan, hold Shift for larger steps" },
    { keys: ["]", "["], action: "Zoom in or out" },
    { keys: ["R"], action: "Rotate 90°" },
    { keys: ["Enter"], action: "Apply the crop" },
  ],
  "inline-edit": [
    { keys: ["Enter"], action: "Save" },
    { keys: ["Escape"], action: "Discard the draft" },
  ],
  "json-viewer": [
    { keys: UP_DOWN, action: "Move between rows" },
    { keys: LEFT_RIGHT, action: "Collapse or expand" },
    { keys: ["Mod+C"], action: "Copy the value" },
    { keys: ["Mod+Shift+C"], action: "Copy the path" },
  ],
  "log-viewer": [
    { keys: UP_DOWN, action: "Scroll through log lines" },
    { keys: HOME_END, action: "Jump to start or end of logs" },
    { keys: PAGE, action: "Scroll by one page" },
    { keys: ["Escape"], action: "Clear search filter" },
  ],
  "mention-textarea": [
    { keys: UP_DOWN, action: "Move through suggestions" },
    { keys: ["Enter", "Tab"], action: "Insert the mention" },
    { keys: ["Escape"], action: "Dismiss suggestions" },
  ],
  "multi-select": [
    { keys: UP_DOWN, action: "Open, then move through options" },
    { keys: ["Enter"], action: "Toggle the highlighted option" },
    { keys: ["Backspace"], action: "Select the last chip, then remove it" },
    { keys: LEFT_RIGHT, action: "Move between chips" },
    { keys: ["Escape"], action: "Close the list" },
  ],
  "notification-inbox": [
    { keys: UP_DOWN, action: "Move between notifications" },
    { keys: HOME_END, action: "First or last notification" },
    { keys: ["Escape"], action: "Close and return focus" },
  ],
  "number-input": [
    { keys: UP_DOWN, action: "Step the value" },
    { keys: ["Shift", ...PAGE], action: "Step by the large step" },
    { keys: HOME_END, action: "Jump to min or max" },
  ],
  "onboarding-checklist": [
    { keys: ["Space"], action: "Toggle the focused checklist item" },
    { keys: ["Enter"], action: "Activate the action button or link" },
    { keys: ["Tab"], action: "Move focus between items and actions" },
  ],
  "permission-matrix": [
    { keys: ARROWS, action: "Move between cells" },
    { keys: HOME_END, action: "First or last column" },
    { keys: PAGE, action: "First or last row" },
    { keys: ["Space", "Enter"], action: "Toggle the permission" },
  ],
  "phone-input": [
    { keys: UP_DOWN, action: "Move through countries" },
    { keys: ["Enter"], action: "Pick the country" },
    { keys: ["Escape"], action: "Close the picker" },
  ],
  rating: [
    { keys: ARROWS, action: "Change by one step" },
    { keys: HOME_END, action: "Lowest or highest score" },
  ],
  "saved-views": [
    { keys: LEFT_RIGHT, action: "Move between views" },
    { keys: HOME_END, action: "First or last view" },
    { keys: ["F2"], action: "Rename the focused view" },
    { keys: ["Escape"], action: "Cancel a rename" },
  ],
  "shortcut-cheatsheet": [
    { keys: ["?"], action: "Open the cheatsheet" },
    { keys: ["Escape"], action: "Close it" },
  ],
  "shortcut-recorder": [
    { keys: ["Escape"], action: "Stop recording" },
    { keys: ["Backspace"], action: "Clear the shortcut" },
  ],
  "sortable-list": [
    { keys: ["Space", "Enter"], action: "Pick up or drop an item" },
    { keys: UP_DOWN, action: "Move the picked-up item" },
    { keys: HOME_END, action: "Move it to the start or end" },
    { keys: ["Escape"], action: "Cancel the move" },
  ],
  "tags-input": [
    { keys: ["Enter", ","], action: "Add the tag" },
    { keys: ["Backspace"], action: "Select the last tag, then remove it" },
    { keys: LEFT_RIGHT, action: "Move between tags" },
  ],
  "time-field": [
    { keys: UP_DOWN, action: "Step and wrap the segment" },
    { keys: LEFT_RIGHT, action: "Move between segments" },
    { keys: HOME_END, action: "Jump to min or max" },
    { keys: ["Backspace"], action: "Clear the segment" },
  ],
  "timezone-picker": [
    { keys: UP_DOWN, action: "Move through zones" },
    { keys: ["Enter"], action: "Pick the zone" },
  ],
  toast: [
    { keys: ["Alt+T"], action: "Focus the toasts (Radix)" },
    { keys: ["F6"], action: "Focus the toasts (Base UI)" },
    { keys: ["Mod+Z"], action: "Undo the newest undo toast" },
    { keys: ["Tab"], action: "Move to Undo, actions and close" },
    {
      keys: ["Escape"],
      action: "Collapse the stack (Radix) or close the toast (Base UI)",
    },
  ],
  tour: [
    { keys: LEFT_RIGHT, action: "Previous or next step" },
    { keys: ["Escape"], action: "End the tour" },
  ],
  "trace-waterfall": [
    { keys: UP_DOWN, action: "Move between spans" },
    { keys: ["ArrowRight"], action: "Expand, then enter children" },
    { keys: ["ArrowLeft"], action: "Collapse, then go to the parent" },
    { keys: HOME_END, action: "First or last span" },
    { keys: ["Enter", "Space"], action: "Select or deselect the span" },
  ],
  "transfer-list": [
    { keys: UP_DOWN, action: "Move through items" },
    { keys: HOME_END, action: "First or last item" },
    { keys: ["Space"], action: "Toggle the item" },
    {
      keys: ["Shift+ArrowUp", "Shift+ArrowDown"],
      action: "Extend the selection",
    },
  ],
  "tree-view": [
    { keys: UP_DOWN, action: "Move between rows" },
    { keys: ["ArrowRight"], action: "Expand, then enter children" },
    { keys: ["ArrowLeft"], action: "Collapse, then go to the parent" },
    { keys: HOME_END, action: "First or last row" },
    { keys: ["Enter"], action: "Select" },
    { keys: ["Space"], action: "Check, in multiple mode" },
  ],
  "unit-input": [
    { keys: UP_DOWN, action: "Step the number in the current unit" },
    {
      keys: ["Shift+ArrowUp", "Shift+ArrowDown", ...PAGE],
      action: "Step by ten",
    },
    { keys: HOME_END, action: "Jump to min or max" },
    { keys: ["Enter"], action: "Apply typed text such as 2gb" },
  ],
  "uptime-bar": [
    { keys: LEFT_RIGHT, action: "Move between segments" },
    { keys: HOME_END, action: "First or last segment" },
    { keys: ["Enter"], action: "Open the segment's details" },
  ],
  "virtual-list": [
    { keys: UP_DOWN, action: "Move between rows" },
    { keys: PAGE, action: "Move a page at a time" },
    { keys: HOME_END, action: "First or last row" },
  ],
}
