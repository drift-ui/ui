import type { ComponentType } from "react"

import { AvatarPreview as BaseUiAvatarPreview } from "@/components/preview/base/avatar-preview"
import { BadgePreview as BaseUiBadgePreview } from "@/components/preview/base/badge-preview"
import { BulkActionBarPreview as BaseUiBulkActionBarPreview } from "@/components/preview/base/bulk-action-bar-preview"
import { ButtonPreview as BaseUiButtonPreview } from "@/components/preview/base/button-preview"
import { DialogPreview as BaseUiDialogPreview } from "@/components/preview/base/dialog-preview"
import { LabelPreview as BaseUiLabelPreview } from "@/components/preview/base/label-preview"
import { MentionTextareaPreview as BaseUiMentionTextareaPreview } from "@/components/preview/base/mention-textarea-preview"
import { MultiSelectPreview as BaseUiMultiSelectPreview } from "@/components/preview/base/multi-select-preview"
import { PopoverPreview as BaseUiPopoverPreview } from "@/components/preview/base/popover-preview"
import { QueryInputPreview as BaseUiQueryInputPreview } from "@/components/preview/base/query-input-preview"
import { StepperPreview as BaseUiStepperPreview } from "@/components/preview/base/stepper-preview"
import { TemplateInputPreview as BaseUiTemplateInputPreview } from "@/components/preview/base/template-input-preview"
import { ToastPreview as BaseUiToastPreview } from "@/components/preview/base/toast-preview"
import { TourPreview as BaseUiTourPreview } from "@/components/preview/base/tour-preview"
import { ActivityHeatmapPreview } from "@/components/preview/activity-heatmap-preview"
import { AvatarGroupPreview } from "@/components/preview/avatar-group-preview"
import { AvatarPreview } from "@/components/preview/avatar-preview"
import { BadgePreview } from "@/components/preview/badge-preview"
import { BulkActionBarPreview } from "@/components/preview/bulk-action-bar-preview"
import { ButtonPreview } from "@/components/preview/button-preview"
import { CardPreview } from "@/components/preview/card-preview"
import { ColorPickerPreview } from "@/components/preview/color-picker-preview"
import { CommentThreadPreview } from "@/components/preview/comment-thread-preview"
import { CsvImporterPreview } from "@/components/preview/csv-importer-preview"
import { DateTimeRangePreview } from "@/components/preview/date-time-range-preview"
import { DescriptionListPreview } from "@/components/preview/description-list-preview"
import { DialogPreview } from "@/components/preview/dialog-preview"
import { DiffViewerPreview } from "@/components/preview/diff-viewer-preview"
import { DurationInputPreview } from "@/components/preview/duration-input-preview"
import { EmojiPickerPreview } from "@/components/preview/emoji-picker-preview"
import { FileDropzonePreview } from "@/components/preview/file-dropzone-preview"
import { FilterBuilderPreview } from "@/components/preview/filter-builder-preview"
import { ImageCropperPreview } from "@/components/preview/image-cropper-preview"
import { InlineEditPreview } from "@/components/preview/inline-edit-preview"
import { InputPreview } from "@/components/preview/input-preview"
import { JsonViewerPreview } from "@/components/preview/json-viewer-preview"
import { KeyValueEditorPreview } from "@/components/preview/key-value-editor-preview"
import { LabelPreview } from "@/components/preview/label-preview"
import { LogViewerPreview } from "@/components/preview/log-viewer-preview"
import { MaskedInputPreview } from "@/components/preview/masked-input-preview"
import { MentionTextareaPreview } from "@/components/preview/mention-textarea-preview"
import { MultiSelectPreview } from "@/components/preview/multi-select-preview"
import { NotificationInboxPreview } from "@/components/preview/notification-inbox-preview"
import { NumberInputPreview } from "@/components/preview/number-input-preview"
import { OnboardingChecklistPreview } from "@/components/preview/onboarding-checklist-preview"
import { PasswordInputPreview } from "@/components/preview/password-input-preview"
import { PermissionMatrixPreview } from "@/components/preview/permission-matrix-preview"
import { PopoverPreview } from "@/components/preview/popover-preview"
import { QueryInputPreview } from "@/components/preview/query-input-preview"
import { PhoneInputPreview } from "@/components/preview/phone-input-preview"
import { RatingPreview } from "@/components/preview/rating-preview"
import { RecurrenceEditorPreview } from "@/components/preview/recurrence-editor-preview"
import { SavedViewsPreview } from "@/components/preview/saved-views-preview"
import { SecretFieldPreview } from "@/components/preview/secret-field-preview"
import { ShortcutCheatsheetPreview } from "@/components/preview/shortcut-cheatsheet-preview"
import { ShortcutRecorderPreview } from "@/components/preview/shortcut-recorder-preview"
import { SignaturePadPreview } from "@/components/preview/signature-pad-preview"
import { SortableListPreview } from "@/components/preview/sortable-list-preview"
import { StepperPreview } from "@/components/preview/stepper-preview"
import { TagsInputPreview } from "@/components/preview/tags-input-preview"
import { TemplateInputPreview } from "@/components/preview/template-input-preview"
import { TimeFieldPreview } from "@/components/preview/time-field-preview"
import { TimelinePreview } from "@/components/preview/timeline-preview"
import { TimezonePickerPreview } from "@/components/preview/timezone-picker-preview"
import { ToastPreview } from "@/components/preview/toast-preview"
import { TourPreview } from "@/components/preview/tour-preview"
import { TraceWaterfallPreview } from "@/components/preview/trace-waterfall-preview"
import { TransferListPreview } from "@/components/preview/transfer-list-preview"
import { TreeViewPreview } from "@/components/preview/tree-view-preview"
import { UnitInputPreview } from "@/components/preview/unit-input-preview"
import { UptimeBarPreview } from "@/components/preview/uptime-bar-preview"
import { VirtualListPreview } from "@/components/preview/virtual-list-preview"

export const PREVIEWS: Record<string, ComponentType> = {
  "activity-heatmap": ActivityHeatmapPreview,
  avatar: AvatarPreview,
  "avatar-group": AvatarGroupPreview,
  badge: BadgePreview,
  "bulk-action-bar": BulkActionBarPreview,
  button: ButtonPreview,
  card: CardPreview,
  "color-picker": ColorPickerPreview,
  "comment-thread": CommentThreadPreview,
  "csv-importer": CsvImporterPreview,
  "date-time-range": DateTimeRangePreview,
  "description-list": DescriptionListPreview,
  dialog: DialogPreview,
  "diff-viewer": DiffViewerPreview,
  "duration-input": DurationInputPreview,
  "emoji-picker": EmojiPickerPreview,
  "file-dropzone": FileDropzonePreview,
  "filter-builder": FilterBuilderPreview,
  "image-cropper": ImageCropperPreview,
  "inline-edit": InlineEditPreview,
  input: InputPreview,
  "json-viewer": JsonViewerPreview,
  "key-value-editor": KeyValueEditorPreview,
  label: LabelPreview,
  "log-viewer": LogViewerPreview,
  "masked-input": MaskedInputPreview,
  "mention-textarea": MentionTextareaPreview,
  "multi-select": MultiSelectPreview,
  "notification-inbox": NotificationInboxPreview,
  "number-input": NumberInputPreview,
  "onboarding-checklist": OnboardingChecklistPreview,
  "password-input": PasswordInputPreview,
  "permission-matrix": PermissionMatrixPreview,
  popover: PopoverPreview,
  "phone-input": PhoneInputPreview,
  "query-input": QueryInputPreview,
  rating: RatingPreview,
  "recurrence-editor": RecurrenceEditorPreview,
  "saved-views": SavedViewsPreview,
  "secret-field": SecretFieldPreview,
  "shortcut-cheatsheet": ShortcutCheatsheetPreview,
  "shortcut-recorder": ShortcutRecorderPreview,
  "signature-pad": SignaturePadPreview,
  "sortable-list": SortableListPreview,
  stepper: StepperPreview,
  "tags-input": TagsInputPreview,
  "template-input": TemplateInputPreview,
  "time-field": TimeFieldPreview,
  timeline: TimelinePreview,
  "timezone-picker": TimezonePickerPreview,
  toast: ToastPreview,
  tour: TourPreview,
  "trace-waterfall": TraceWaterfallPreview,
  "transfer-list": TransferListPreview,
  "tree-view": TreeViewPreview,
  "unit-input": UnitInputPreview,
  "uptime-bar": UptimeBarPreview,
  "virtual-list": VirtualListPreview,
}

export const BASE_UI_PREVIEWS: Record<string, ComponentType> = {
  avatar: BaseUiAvatarPreview,
  badge: BaseUiBadgePreview,
  "bulk-action-bar": BaseUiBulkActionBarPreview,
  button: BaseUiButtonPreview,
  dialog: BaseUiDialogPreview,
  label: BaseUiLabelPreview,
  "mention-textarea": BaseUiMentionTextareaPreview,
  "multi-select": BaseUiMultiSelectPreview,
  popover: BaseUiPopoverPreview,
  "query-input": BaseUiQueryInputPreview,
  stepper: BaseUiStepperPreview,
  "template-input": BaseUiTemplateInputPreview,
  toast: BaseUiToastPreview,
  tour: BaseUiTourPreview,
}
