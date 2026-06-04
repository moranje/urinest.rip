import { ref } from "vue";
import type { PopoverStyle, QuestionOption } from "../types";

export function usePopover() {
  const activePopoverOptionId = ref<string | null>(null);
  const popoverShouldFocus = ref(false);
  const popoverDescription = ref("");
  const popoverStyle = ref<PopoverStyle>({ top: "0px", left: "0px", visibility: "hidden" });
  let hidePopoverTimeout: ReturnType<typeof setTimeout> | null = null;
  let focusRestoreTarget: HTMLElement | null = null;
  let ignoredFocusTarget: HTMLElement | null = null;

  const showPopover = (option: QuestionOption, event: MouseEvent | FocusEvent): void => {
    if (hidePopoverTimeout) clearTimeout(hidePopoverTimeout);
    const target = event.currentTarget as HTMLElement;
    if (event.type === "focus" && target === ignoredFocusTarget) {
      ignoredFocusTarget = null;
      return;
    }
    const shouldManageFocus = event.type === "click";
    popoverShouldFocus.value = shouldManageFocus;
    if (shouldManageFocus) focusRestoreTarget = target;
    const rect = target.getBoundingClientRect();
    activePopoverOptionId.value = option.id;
    popoverDescription.value = option.description || "";

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const margin = 16;
    const availableWidth = windowWidth - margin * 2;
    const popoverWidth = Math.min(300, availableWidth);
    const gap = 5;
    const viewportMaxHeight = Math.max(48, windowHeight - margin * 2);
    const preferredMaxHeight = Math.min(300, viewportMaxHeight);

    const spaceBelow = Math.max(0, windowHeight - margin - rect.bottom - gap);
    const spaceAbove = Math.max(0, rect.top - gap - margin);
    const minimumUsefulHeight = Math.min(preferredMaxHeight, 120);
    const opensBelow = spaceBelow >= minimumUsefulHeight || spaceBelow >= spaceAbove;
    const placementSpace = opensBelow ? spaceBelow : spaceAbove;
    const popoverMaxHeight = Math.max(48, Math.min(preferredMaxHeight, placementSpace));

    const style: PopoverStyle = {
      position: "fixed",
      visibility: "visible",
      opacity: 1,
      maxWidth: `${popoverWidth}px`,
      maxHeight: `${popoverMaxHeight}px`,
    };

    if (opensBelow) {
      style.top = `${Math.max(
        margin,
        Math.min(rect.bottom + gap, windowHeight - margin - popoverMaxHeight),
      )}px`;
    } else {
      style.top = `${Math.max(margin, rect.top - gap - popoverMaxHeight)}px`;
    }

    const iconCenter = rect.left + rect.width / 2;
    let left = iconCenter - popoverWidth / 2;
    if (left + popoverWidth > windowWidth - margin) {
      left = windowWidth - margin - popoverWidth;
    }
    if (left < margin) {
      left = margin;
    }
    style.left = `${left}px`;

    popoverStyle.value = style;
  };

  const closePopover = (): void => {
    if (hidePopoverTimeout) {
      clearTimeout(hidePopoverTimeout);
      hidePopoverTimeout = null;
    }
    const target = popoverShouldFocus.value ? focusRestoreTarget : null;
    activePopoverOptionId.value = null;
    popoverShouldFocus.value = false;
    popoverStyle.value.visibility = "hidden";
    popoverStyle.value.opacity = 0;
    ignoredFocusTarget = target;
    queueMicrotask(() => {
      if (target && document.contains(target)) target.focus({ preventScroll: true });
      else if (ignoredFocusTarget === target) ignoredFocusTarget = null;
    });
  };

  const cancelPopoverClose = (): void => {
    if (hidePopoverTimeout) {
      clearTimeout(hidePopoverTimeout);
      hidePopoverTimeout = null;
    }
  };

  const schedulePopoverClose = (): void => {
    if (hidePopoverTimeout) clearTimeout(hidePopoverTimeout);
    hidePopoverTimeout = setTimeout(() => {
      closePopover();
    }, 300);
  };

  const togglePopover = (option: QuestionOption, event: MouseEvent | FocusEvent): void => {
    if (activePopoverOptionId.value === option.id) {
      closePopover();
    } else {
      showPopover(option, event);
    }
  };

  return {
    activePopoverOptionId,
    popoverShouldFocus,
    popoverDescription,
    popoverStyle,
    showPopover,
    closePopover,
    cancelPopoverClose,
    schedulePopoverClose,
    togglePopover,
  };
}
