"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  className?: string;
  confirmMessage: string;
  disabled?: boolean;
  form?: string;
  children: ReactNode;
};

export function ConfirmSubmitButton({
  className,
  confirmMessage,
  disabled,
  form,
  children
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled}
      form={form}
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
