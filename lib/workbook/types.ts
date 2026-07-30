export type PriceStatus = 'FREE' | 'PAID' | 'UNKNOWN';
export type ItemType = 'COURSE' | 'WEBINAR' | 'SEMINAR' | 'EVENT';
export type ItemFormat = 'ONLINE' | 'PHYSICAL';
export type Tier = 'FUNDAMENTALS' | 'BASICS' | 'ADVANCED' | 'EXPERT';
export type RunStatus = 'SUCCESS' | 'FAILED';
export type EmailKind = 'PM_NOTIFICATION' | 'REMINDER' | 'SYSTEM_ALERT';

export interface TopicRow {
  id: string;
  name: string;
  category: string;
  keywords: string;
}

export interface DiscoveredItemRow {
  id: string;
  title: string;
  type: ItemType;
  provider: string;
  url: string;
  description: string;
  format: ItemFormat;
  location: string;
  startDate: string | null;
  endDate: string | null;
  duration: string | null;
  priceStatus: PriceStatus;
  tier: Tier;
  tierRationale: string;
  relevanceScore: number;
  speakersCompanies: string;
  active: boolean;
  discoveredAt: string;
  sourceQuery: string;
  topicIds: string;
}

export interface InterestRequestRow {
  id: string;
  itemId: string;
  employeeName: string;
  employeeEmail: string;
  pmName: string | null;
  pmEmail: string | null;
  pmNotified: boolean;
  pmNotifiedAt: string | null;
  createdAt: string;
  reminderSent: boolean;
}

export interface SearchRunRow {
  id: string;
  topicId: string;
  ranAt: string;
  status: RunStatus;
  itemsFound: number;
  itemsAdded: number;
  errorNote: string;
}

export interface SettingRow {
  key: string;
  value: string;
}

export interface SentEmailRow {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  kind: EmailKind;
}

export interface Workbook {
  topics: TopicRow[];
  discoveredItems: DiscoveredItemRow[];
  interestRequests: InterestRequestRow[];
  searchRuns: SearchRunRow[];
  settings: SettingRow[];
  sentEmails: SentEmailRow[];
}

export function emptyWorkbook(): Workbook {
  return {
    topics: [],
    discoveredItems: [],
    interestRequests: [],
    searchRuns: [],
    settings: [],
    sentEmails: [],
  };
}

export function getSetting(wb: Workbook, key: string): string | undefined {
  return wb.settings.find((s) => s.key === key)?.value;
}

export function setSetting(wb: Workbook, key: string, value: string): void {
  const row = wb.settings.find((s) => s.key === key);
  if (row) row.value = value;
  else wb.settings.push({ key, value });
}
