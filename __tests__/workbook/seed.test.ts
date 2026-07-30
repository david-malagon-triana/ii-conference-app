import { describe, it, expect } from 'vitest';
import { seedTopics, defaultSettings } from '../../lib/workbook/seed';

describe('seedTopics', () => {
  it('returns the five topics from the design spec, each with keywords', () => {
    const topics = seedTopics();
    expect(topics.map((t) => t.name)).toEqual([
      'Intelligent Supply Chain',
      'Smart Assets',
      'Data for Industry',
      'Data Strategy',
      'Sustainable Industry',
    ]);
    for (const t of topics) {
      expect(t.id).toBeTruthy();
      expect(t.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe('defaultSettings', () => {
  it('includes reminderLeadDays, discoveryScheduleTime, systemAlertEmail, adminPasscode', () => {
    const settings = defaultSettings();
    const keys = settings.map((s) => s.key);
    expect(keys).toContain('reminderLeadDays');
    expect(keys).toContain('discoveryScheduleTime');
    expect(keys).toContain('systemAlertEmail');
    expect(keys).toContain('adminPasscode');
    expect(settings.find((s) => s.key === 'reminderLeadDays')?.value).toBe('3');
  });
});
