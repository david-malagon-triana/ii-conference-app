import { describe, it, expect } from 'vitest';
import { classify } from '../../lib/discovery/classifier';
import { TopicRow } from '../../lib/workbook/types';

const topic: TopicRow = {
  id: 't1',
  name: 'Data for Industry',
  category: 'Data for Industry',
  keywords: 'Data Visualization, Data Science, Gen AI',
};

describe('classify - type detection', () => {
  it('detects webinar', () => {
    const r = classify({ title: 'Free webinar on Gen AI', url: 'https://x.com/1', snippet: '' }, topic);
    expect(r.type).toBe('WEBINAR');
  });
  it('detects course', () => {
    const r = classify({ title: 'Gen AI certification course', url: 'https://x.com/2', snippet: '' }, topic);
    expect(r.type).toBe('COURSE');
  });
  it('detects seminar/conference/summit', () => {
    const r = classify({ title: 'Data Science Summit 2026', url: 'https://x.com/3', snippet: '' }, topic);
    expect(r.type).toBe('SEMINAR');
  });
  it('defaults to EVENT when nothing matches', () => {
    const r = classify({ title: 'Gen AI in practice', url: 'https://x.com/4', snippet: '' }, topic);
    expect(r.type).toBe('EVENT');
  });
});

describe('classify - format detection', () => {
  it('detects online from "online"/"virtual"', () => {
    const r = classify({ title: 'Online Gen AI course', url: 'https://x.com/5', snippet: '' }, topic);
    expect(r.format).toBe('ONLINE');
  });
  it('defaults to physical', () => {
    const r = classify({ title: 'Gen AI summit in Oslo', url: 'https://x.com/6', snippet: '' }, topic);
    expect(r.format).toBe('PHYSICAL');
  });
});

describe('classify - price detection', () => {
  it('detects free', () => {
    const r = classify({ title: 'Free Gen AI webinar', url: 'https://x.com/7', snippet: 'no cost to attend' }, topic);
    expect(r.priceStatus).toBe('FREE');
  });
  it('detects paid from a currency token', () => {
    const r = classify({ title: 'Gen AI summit', url: 'https://x.com/8', snippet: 'Registration fee: 2000 NOK' }, topic);
    expect(r.priceStatus).toBe('PAID');
  });
  it('defaults to unknown', () => {
    const r = classify({ title: 'Gen AI summit', url: 'https://x.com/9', snippet: 'Join industry leaders' }, topic);
    expect(r.priceStatus).toBe('UNKNOWN');
  });
});

describe('classify - tier detection', () => {
  it('detects fundamentals from "introduction to"/"101"/"beginner"', () => {
    const r = classify({ title: 'Introduction to Gen AI, 101', url: 'https://x.com/10', snippet: '' }, topic);
    expect(r.tier).toBe('FUNDAMENTALS');
  });
  it('detects advanced from "advanced"/"certification"/"practitioner"', () => {
    const r = classify({ title: 'Advanced Gen AI practitioner certification', url: 'https://x.com/11', snippet: '' }, topic);
    expect(r.tier).toBe('ADVANCED');
  });
  it('detects expert from "expert"/"masterclass"/"summit"', () => {
    const r = classify({ title: 'Gen AI expert masterclass', url: 'https://x.com/12', snippet: '' }, topic);
    expect(r.tier).toBe('EXPERT');
  });
  it('defaults to basics when nothing scores clearly', () => {
    const r = classify({ title: 'Gen AI in practice', url: 'https://x.com/13', snippet: '' }, topic);
    expect(r.tier).toBe('BASICS');
  });
});

describe('classify - relevance score', () => {
  it('scores higher when more topic keywords are present', () => {
    const high = classify(
      { title: 'Data Visualization and Data Science with Gen AI', url: 'https://x.com/14', snippet: '' },
      topic,
    );
    const low = classify({ title: 'Gen AI overview', url: 'https://x.com/15', snippet: '' }, topic);
    expect(high.relevanceScore).toBeGreaterThan(low.relevanceScore);
    expect(high.relevanceScore).toBeLessThanOrEqual(1);
    expect(low.relevanceScore).toBeGreaterThanOrEqual(0);
  });
});

describe('classify - date extraction', () => {
  it('extracts a date like "12 September 2026"', () => {
    const r = classify(
      { title: 'Gen AI summit', url: 'https://x.com/16', snippet: 'Join us on 12 September 2026 in Oslo' },
      topic,
    );
    expect(r.startDate).toBe('2026-09-12');
  });
  it('returns null when no date pattern is found', () => {
    const r = classify({ title: 'Gen AI summit', url: 'https://x.com/17', snippet: 'Join industry leaders' }, topic);
    expect(r.startDate).toBeNull();
  });
});

describe('classify - duration extraction', () => {
  it('extracts an hours-based duration', () => {
    const r = classify({ title: 'Gen AI webinar', url: 'https://x.com/18', snippet: 'A 2 hour session' }, topic);
    expect(r.duration).toBe('2 hours');
  });
  it('extracts a days-based duration', () => {
    const r = classify({ title: 'Gen AI summit', url: 'https://x.com/19', snippet: 'A 3 day event' }, topic);
    expect(r.duration).toBe('3 days');
  });
  it('extracts "self-paced" / "half-day" / "full-day" phrasing', () => {
    const r = classify({ title: 'Gen AI course', url: 'https://x.com/20', snippet: 'Self-paced, 4 weeks' }, topic);
    expect(r.duration).toBe('self-paced, 4 weeks');
  });
  it('returns null when no duration pattern is found', () => {
    const r = classify({ title: 'Gen AI summit', url: 'https://x.com/21', snippet: 'Join industry leaders' }, topic);
    expect(r.duration).toBeNull();
  });
});
