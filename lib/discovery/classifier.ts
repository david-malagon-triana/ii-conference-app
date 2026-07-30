import { ItemType, ItemFormat, PriceStatus, Tier, TopicRow } from '../workbook/types';

export interface RawResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ClassifiedDraft {
  type: ItemType;
  format: ItemFormat;
  priceStatus: PriceStatus;
  tier: Tier;
  tierRationale: string;
  relevanceScore: number;
  startDate: string | null;
  duration: string | null;
}

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

function detectType(text: string): ItemType {
  if (/\bwebinar\b/.test(text)) return 'WEBINAR';
  if (/\b(course|training|certification)\b/.test(text)) return 'COURSE';
  if (/\b(conference|summit|seminar)\b/.test(text)) return 'SEMINAR';
  return 'EVENT';
}

function detectFormat(text: string): ItemFormat {
  if (/\b(online|virtual|webinar)\b/.test(text)) return 'ONLINE';
  return 'PHYSICAL';
}

function detectPriceStatus(text: string): PriceStatus {
  if (/\b(free|no cost|complimentary)\b/.test(text)) return 'FREE';
  if (/(\$|€|kr\b|nok\b|fee|price)/.test(text)) return 'PAID';
  return 'UNKNOWN';
}

function detectTier(text: string): { tier: Tier; rationale: string } {
  if (/\b(introduction to|101|beginner)\b/.test(text)) {
    return { tier: 'FUNDAMENTALS', rationale: 'Matched a beginner/introductory keyword' };
  }
  if (/\b(expert|masterclass|summit)\b/.test(text)) {
    return { tier: 'EXPERT', rationale: 'Matched an expert-level keyword' };
  }
  if (/\b(advanced|certification|practitioner)\b/.test(text)) {
    return { tier: 'ADVANCED', rationale: 'Matched an advanced-level keyword' };
  }
  return { tier: 'BASICS', rationale: 'No clear tier keyword matched; defaulted to Basics' };
}

function computeRelevanceScore(text: string, keywords: string): number {
  const kws = keywords
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  if (kws.length === 0) return 0;
  const matches = kws.filter((k) => text.includes(k.toLowerCase()));
  return Math.round((matches.length / kws.length) * 100) / 100;
}

function extractDate(text: string): string | null {
  const match = text.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

function extractDuration(text: string): string | null {
  const selfPaced = text.match(/self-paced,?\s*\d+\s*weeks?/);
  if (selfPaced) return selfPaced[0].replace(/\s+/g, ' ').trim();

  const unitMatch = text.match(/\b(\d+)\s*(hours?|hrs?|days?|weeks?)\b/);
  if (unitMatch) {
    const [, amount, rawUnit] = unitMatch;
    const unit = rawUnit.startsWith('hr') || rawUnit.startsWith('hour') ? 'hour' : rawUnit.replace(/s$/, '');
    return `${amount} ${unit}${amount === '1' ? '' : 's'}`;
  }

  if (/half-day/.test(text)) return 'half-day';
  if (/full-day/.test(text)) return 'full-day';

  return null;
}

export function classify(raw: RawResult, topic: TopicRow): ClassifiedDraft {
  const text = `${raw.title} ${raw.snippet}`.toLowerCase();
  const { tier, rationale } = detectTier(text);

  return {
    type: detectType(text),
    format: detectFormat(text),
    priceStatus: detectPriceStatus(text),
    tier,
    tierRationale: rationale,
    relevanceScore: computeRelevanceScore(text, topic.keywords),
    startDate: extractDate(text),
    duration: extractDuration(text),
  };
}
