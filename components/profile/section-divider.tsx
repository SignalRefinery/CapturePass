type SectionDividerProps = {
  title: string;
  className?: string;
  lineClassName?: string;
  titleClassName?: string;
};

export function SectionDivider({ title, className, lineClassName, titleClassName }: SectionDividerProps) {
  return (
    <div className={className} aria-label={title}>
      <span className={lineClassName} aria-hidden="true" />
      <h2 className={titleClassName}>{title}</h2>
      <span className={lineClassName} aria-hidden="true" />
    </div>
  );
}
