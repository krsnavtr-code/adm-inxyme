import React, { useEffect, useRef } from "react";

/**
 * Accessible native <dialog> modal wrapper with top-layer rendering,
 * Escape support, and light-dismiss fallback for browsers without closedby.
 */
export default function NativeModalDialog({
  open,
  onClose,
  titleId,
  closedBy = "any",
  maxWidthClass = "max-w-2xl",
  children,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      if (onClose) onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // Fallback light-dismiss when native closedby="any" is unsupported (e.g., Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || closedBy !== "any") return;
    if ("closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    const onPointerDown = (e) => {
      pressedOutside = dialog.open && isOutside(e);
    };
    const onPointerUp = (e) => {
      if (pressedOutside && dialog.open && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [closedBy]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: closedBy })}
      className={`m-auto w-[calc(100%-2rem)] ${maxWidthClass} rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl open:flex open:flex-col max-h-[92vh] overflow-hidden`}
    >
      {open ? children : null}
    </dialog>
  );
}
