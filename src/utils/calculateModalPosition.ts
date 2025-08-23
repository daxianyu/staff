export interface ModalPosition {
  x: number;
  y: number;
  slideDirection: 'left' | 'right' | 'center';
}

interface BoxLike {
  x?: number;
  y?: number;
  clientX?: number;
  clientY?: number;
  /**
   * Optional event target used to locate the closest time slot element.
   */
  target?: EventTarget | null;
}

/**
 * Calculate the best position for the add-event modal. The logic tries to keep
 * the modal near the interacted time slot and prefers placing it on the right
 * side, then left side, and finally centered below the slot.
 */
export function calculateModalPosition(
  box?: BoxLike,
  modalWidth = 384,
): ModalPosition {
  const screenWidth = window.innerWidth;

  // Initial coordinates: use box values when available, otherwise fall back
  // to the center of the screen.
  let modalX = box?.clientX ?? box?.x ?? screenWidth / 2;
  let modalY = box?.clientY ?? box?.y ?? window.innerHeight / 2;

  // Try to find the related time slot element to determine optimal placement.
  const element =
    (box?.target instanceof HTMLElement
      ? box.target
      : document.elementFromPoint(modalX, modalY)) as HTMLElement | null;
  const timeSlot = element?.closest(
    '.rbc-time-slot, .rbc-day-slot, .rbc-date-cell',
  ) as HTMLElement | null;

  if (timeSlot) {
    const rect = timeSlot.getBoundingClientRect();
    const leftSpace = rect.left;
    const rightSpace = screenWidth - rect.right;

    let slideDirection: 'left' | 'right' | 'center';
    if (rightSpace >= modalWidth + 30) {
      modalX = rect.right + 20;
      modalY = rect.top;
      slideDirection = 'right';
    } else if (leftSpace >= modalWidth + 30) {
      modalX = rect.left - modalWidth - 20;
      modalY = rect.top;
      slideDirection = 'left';
    } else {
      modalX = Math.max(
        10,
        Math.min(rect.left + (rect.width - modalWidth) / 2, screenWidth - modalWidth - 10),
      );
      modalY = rect.bottom + 10;
      slideDirection = 'center';
    }

    return { x: modalX, y: modalY, slideDirection };
  }

  // Fallback: place modal relative to viewport when no slot is found.
  const leftEnough = modalX > modalWidth + 40;
  const rightEnough = screenWidth - modalX > modalWidth + 40;
  let slideDirection: 'left' | 'right' | 'center' = 'center';

  if (rightEnough) {
    modalX += 20;
    slideDirection = 'right';
  } else if (leftEnough) {
    modalX -= modalWidth + 20;
    slideDirection = 'left';
  } else {
    modalX = Math.max(10, Math.min(modalX - modalWidth / 2, screenWidth - modalWidth - 10));
    slideDirection = 'center';
  }

  return { x: modalX, y: modalY, slideDirection };
}