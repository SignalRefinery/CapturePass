import type { CSSProperties, ReactNode } from "react";

export function AdminTableFrame({
  children,
  maxHeight,
  style
}: {
  children: ReactNode;
  maxHeight?: number;
  style?: CSSProperties;
}) {
  return (
    <div className="admin-table-frame" style={style}>
      <div className="admin-table-scroll" style={maxHeight ? { maxHeight } : undefined}>
        {children}
      </div>
    </div>
  );
}
