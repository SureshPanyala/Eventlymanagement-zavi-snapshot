import { Briefcase, Cpu, GraduationCap, Music, Palette, Sparkles, type LucideProps } from "lucide-react";

const ICONS = {
  technology: Cpu,
  business: Briefcase,
  music: Music,
  design: Palette,
  education: GraduationCap,
} as const;

export default function CategoryIcon({ category, ...props }: { category: string } & LucideProps): JSX.Element {
  const Icon = ICONS[category as keyof typeof ICONS] ?? Sparkles;
  return <Icon aria-hidden {...props} />;
}
