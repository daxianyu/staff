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
  }
  
  export function calculateModalPosition(box?: BoxLike, modalWidth = 384): ModalPosition {
    const screenW = window.innerWidth;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
    let pageX =
      box?.x ??
      (box?.clientX !== undefined ? box.clientX + scrollX : scrollX + screenW / 2);
    const pageY =
      box?.y ??
      (box?.clientY !== undefined ? box.clientY + scrollY : scrollY + 160);
  
    const viewportX = pageX - scrollX;
    const leftEnough = viewportX > modalWidth + 40;
    const rightEnough = screenW - viewportX > modalWidth + 40;
    const slideDirection: 'left' | 'right' | 'center' =
      rightEnough ? 'right' : leftEnough ? 'left' : 'center';
  
    if (rightEnough) {
      pageX += 20;
    } else if (leftEnough) {
      pageX -= modalWidth + 20;
    } else {
      pageX =
        scrollX + Math.max(10, Math.min(viewportX - modalWidth / 2, screenW - modalWidth - 10));
    }
  
    return { x: pageX, y: pageY, slideDirection };
  }