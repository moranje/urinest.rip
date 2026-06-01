import { ref } from "vue";
import type { PopoverStyle, QuestionOption } from "../types";

export function usePopover() {
  const activePopoverOptionId = ref<string | null>(null);
  const popoverDescription = ref("");
  const popoverStyle = ref<PopoverStyle>({ top: "0px", left: "0px", visibility: "hidden" });
  let hidePopoverTimeout: ReturnType<typeof setTimeout> | null = null;

  const showPopover = (option: QuestionOption, event: MouseEvent | FocusEvent): void => {
    if (hidePopoverTimeout) clearTimeout(hidePopoverTimeout);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    activePopoverOptionId.value = option.id;
    popoverDescription.value = option.description || "";

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const margin = 16;
    const availableWidth = windowWidth - margin * 2;
    const popoverWidth = Math.min(300, availableWidth);
    const popoverMaxHeight = 300;
    const gap = 5;

    const spaceBelow = windowHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const fitsBelow = spaceBelow >= Math.min(popoverMaxHeight, 120);

    const style: PopoverStyle = {
      position: "fixed",
      visibility: "visible",
      opacity: 1,
      maxWidth: `${popoverWidth}px`,
    };

    if (fitsBelow) {
      style.top = `${rect.bottom + gap}px`;
    } else {
      style.top = `${Math.max(margin, rect.top - gap - Math.min(popoverMaxHeight, spaceAbove))}px`;
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
    activePopoverOptionId.value = null;
    popoverStyle.value.visibility = "hidden";
    popoverStyle.value.opacity = 0;
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
    popoverDescription,
    popoverStyle,
    showPopover,
    closePopover,
    schedulePopoverClose,
    togglePopover,
  };
}
