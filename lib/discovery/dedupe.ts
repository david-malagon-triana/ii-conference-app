import { DiscoveredItemRow } from '../workbook/types';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDuplicate(
  candidate: { title: string; url: string },
  existing: DiscoveredItemRow[],
): boolean {
  const normalizedCandidateTitle = normalizeTitle(candidate.title);
  return existing.some(
    (item) => item.url === candidate.url || normalizeTitle(item.title) === normalizedCandidateTitle,
  );
}
