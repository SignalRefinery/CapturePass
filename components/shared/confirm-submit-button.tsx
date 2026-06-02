"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  className?: string;
  confirmMessage: string;
  disabled?: boolean;
  children: ReactNode;
};

export function ConfirmSubmitButton({
  className,
  confirmMessage,
  disabled,
  children
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
