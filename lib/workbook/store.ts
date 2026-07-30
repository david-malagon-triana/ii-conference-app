import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';
import { Workbook, emptyWorkbook } from './types';

const SHEETS: { name: keyof Workbook; header: string[] }[] = [
  { name: 'topics', header: ['id', 'name', 'category', 'keywords'] },
  {
    name: 'discoveredItems',
    header: [
      'id', 'title', 'type', 'provider', 'url', 'description', 'format', 'location',
      'startDate', 'endDate', 'duration', 'priceStatus', 'tier', 'tierRationale', 'relevanceScore',
      'speakersCompanies', 'active', 'discoveredAt', 'sourceQuery', 'topicIds',
    ],
  },
  {
    name: 'interestRequests',
    header: [
      'id', 'itemId', 'employeeName', 'employeeEmail', 'pmName', 'pmEmail',
      'pmNotified', 'pmNotifiedAt', 'createdAt', 'reminderSent',
    ],
  },
  { name: 'searchRuns', header: ['id', 'topicId', 'ranAt', 'status', 'itemsFound', 'itemsAdded', 'errorNote'] },
  { name: 'settings', header: ['key', 'value'] },
  { name: 'sentEmails', header: ['id', 'to', 'subject', 'body', 'sentAt', 'kind'] },
];

function rowToObject(name: keyof Workbook, cells: string[]): any {
  switch (name) {
    case 'topics':
      return { id: cells[0], name: cells[1], category: cells[2], keywords: cells[3] };
    case 'discoveredItems':
      return {
        id: cells[0], title: cells[1], type: cells[2], provider: cells[3], url: cells[4],
        description: cells[5], format: cells[6], location: cells[7],
        startDate: cells[8] || null, endDate: cells[9] || null, duration: cells[10] || null,
        priceStatus: cells[11], tier: cells[12], tierRationale: cells[13],
        relevanceScore: parseFloat(cells[14]) || 0, speakersCompanies: cells[15],
        active: cells[16] === 'true', discoveredAt: cells[17], sourceQuery: cells[18],
        topicIds: cells[19],
      };
    case 'interestRequests':
      return {
        id: cells[0], itemId: cells[1], employeeName: cells[2], employeeEmail: cells[3],
        pmName: cells[4] || null, pmEmail: cells[5] || null, pmNotified: cells[6] === 'true',
        pmNotifiedAt: cells[7] || null, createdAt: cells[8], reminderSent: cells[9] === 'true',
      };
    case 'searchRuns':
      return {
        id: cells[0], topicId: cells[1], ranAt: cells[2], status: cells[3],
        itemsFound: parseInt(cells[4], 10) || 0, itemsAdded: parseInt(cells[5], 10) || 0,
        errorNote: cells[6] || '',
      };
    case 'settings':
      return { key: cells[0], value: cells[1] };
    case 'sentEmails':
      return { id: cells[0], to: cells[1], subject: cells[2], body: cells[3], sentAt: cells[4], kind: cells[5] };
  }
}

function objectToRow(name: keyof Workbook, obj: any): (string | number)[] {
  switch (name) {
    case 'topics':
      return [obj.id, obj.name, obj.category, obj.keywords];
    case 'discoveredItems':
      return [
        obj.id, obj.title, obj.type, obj.provider, obj.url, obj.description, obj.format, obj.location,
        obj.startDate ?? '', obj.endDate ?? '', obj.duration ?? '', obj.priceStatus, obj.tier, obj.tierRationale,
        obj.relevanceScore, obj.speakersCompanies, String(obj.active), obj.discoveredAt, obj.sourceQuery,
        obj.topicIds,
      ];
    case 'interestRequests':
      return [
        obj.id, obj.itemId, obj.employeeName, obj.employeeEmail, obj.pmName ?? '', obj.pmEmail ?? '',
        String(obj.pmNotified), obj.pmNotifiedAt ?? '', obj.createdAt, String(obj.reminderSent),
      ];
    case 'searchRuns':
      return [obj.id, obj.topicId, obj.ranAt, obj.status, obj.itemsFound, obj.itemsAdded, obj.errorNote];
    case 'settings':
      return [obj.key, obj.value];
    case 'sentEmails':
      return [obj.id, obj.to, obj.subject, obj.body, obj.sentAt, obj.kind];
  }
}

export async function loadWorkbook(filePath: string): Promise<Workbook> {
  try {
    await fs.access(filePath);
  } catch {
    return emptyWorkbook();
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const result = emptyWorkbook();

  for (const { name } of SHEETS) {
    const sheet = wb.getWorksheet(name);
    if (!sheet) continue;
    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cells = (row.values as any[]).slice(1).map((v) => (v === undefined || v === null ? '' : String(v)));
      rows.push(rowToObject(name, cells));
    });
    (result as any)[name] = rows;
  }

  return result;
}

export async function saveWorkbook(filePath: string, data: Workbook): Promise<void> {
  const wb = new ExcelJS.Workbook();

  for (const { name, header } of SHEETS) {
    const sheet = wb.addWorksheet(name);
    sheet.addRow(header);
    for (const obj of data[name] as any[]) {
      sheet.addRow(objectToRow(name, obj));
    }
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await wb.xlsx.writeFile(tmpPath);
  await fs.rename(tmpPath, filePath);
}

let writeLock: Promise<unknown> = Promise.resolve();

export function withWorkbook<T>(filePath: string, mutator: (wb: Workbook) => Promise<T> | T): Promise<T> {
  const run = writeLock.then(async () => {
    const wb = await loadWorkbook(filePath);
    const result = await mutator(wb);
    await saveWorkbook(filePath, wb);
    return result;
  });
  writeLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
