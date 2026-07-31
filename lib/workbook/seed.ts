import { randomUUID } from 'crypto';
import { TopicRow, SettingRow } from './types';

export function seedTopics(): TopicRow[] {
  const topic = (name: string, category: string, keywords: string[]): TopicRow => ({
    id: randomUUID(),
    name,
    category,
    keywords: keywords.join(', '),
  });

  return [
    topic('Intelligent Supply Chain', 'Intelligent Supply Chain', [
      'Intelligent Supply Chain Transformation',
      'Digital Procurement',
      'Supply Chain Control Tower',
    ]),
    topic('Smart Assets', 'Smart Assets', [
      'II Strategy',
      'Smart Plant Transformation',
      'Digital Continuity',
      'Gigafactory/Battery',
    ]),
    topic('Data for Industry', 'Data for Industry', [
      'Data Visualization',
      'Data Science',
      'Data Foundation',
      'Gen AI',
      'Customer Data & Tech',
    ]),
    topic('Data Strategy', 'Data Strategy', [
      'Data Governance & Operating Model',
      '(Gen) AI Strategy',
      'Performance Management',
    ]),
    topic('Sustainable Industry', 'Sustainable Industry', [
      'ESG reporting',
      'Sustainable Value Chain',
      'Sustainable Performance & Reporting',
    ]),
  ];
}

export function defaultSettings(): SettingRow[] {
  return [
    { key: 'reminderLeadDays', value: '3' },
    { key: 'discoveryScheduleTime', value: '0 6 * * *' },
    { key: 'systemAlertEmail', value: '' },
    { key: 'adminPasscode', value: 'changeme' },
    // Written by every discovery run so the daily schedule survives a process restart.
    { key: 'lastDiscoveryRunAt', value: '' },
  ];
}
