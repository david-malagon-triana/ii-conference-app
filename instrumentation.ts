export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { withWorkbook } = await import('./lib/workbook/store');
    const { getWorkbookPath } = await import('./lib/workbookPath');
    const { seedTopics, defaultSettings } = await import('./lib/workbook/seed');

    await withWorkbook(getWorkbookPath(), (wb) => {
      if (wb.topics.length === 0) {
        wb.topics = seedTopics();
      }
      if (wb.settings.length === 0) {
        wb.settings = defaultSettings();
      }
    });

    const { startDailyScheduler } = await import('./lib/discovery/scheduler');
    startDailyScheduler();
  }
}
