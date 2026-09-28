import { cn } from "@/lib/utils";
import { ChartNoAxesCombined, FilePenLine, TrendingUp } from 'lucide-react';

type IconBoxProps = {
  iconBox: IconBox;
  className?: string;
};

const IconBox = ({
  className,
  iconBox: { icon, title, description },
}: IconBoxProps) => {
  const Graphic = title === 'Copywriting' ? FilePenLine : title === 'Sales growth' ? TrendingUp : ChartNoAxesCombined;
  return (
    <div
      className={cn(
        "hover-shadow z-[1] overflow-hidden rounded-md border border-border bg-card px-7 py-9 before:absolute before:left-0 before:top-0 before:block before:h-[.3125rem] before:w-0 before:bg-primary before:transition-all before:duration-200 hover:before:w-full",
        className,
      )}
    >
      {icon ? <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-primary"><Graphic size={30} strokeWidth={1.8} /></span> : null}
      {title ? <h3 className="mb-4 text-md">{title}</h3> : null}
      {description ? <p>{description}</p> : null}
    </div>
  );
};

export default IconBox;