import { Tier } from '@/lib/workbook/types';

const TIER_LABELS: Record<Tier, string> = {
  FUNDAMENTALS: 'Fundamentals',
  BASICS: 'Basics',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

const TIER_CLASSES: Record<Tier, string> = {
  FUNDAMENTALS: 'bg-tier-fundamentals text-tier-text-dark',
  BASICS: 'bg-tier-basics text-tier-text-dark',
  ADVANCED: 'bg-tier-advanced text-invent-grey1',
  EXPERT: 'bg-tier-expert text-invent-grey1 border border-tier-expert-border',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`self-start inline-block text-xs px-2 py-0.5 rounded-full ${TIER_CLASSES[tier]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}
