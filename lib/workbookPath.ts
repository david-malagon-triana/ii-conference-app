import path from 'path';

export function getWorkbookPath(): string {
  return process.env.WORKBOOK_PATH ?? path.join(process.cwd(), 'data', 'workbook.xlsx');
}
