import { DiscoveredItemRow, InterestRequestRow, TopicRow } from '../workbook/types';

export function buildPmNotificationEmail(
  item: DiscoveredItemRow,
  request: InterestRequestRow,
): { subject: string; body: string } {
  return {
    subject: `Attendance request: ${item.title}`,
    body:
      `Hi ${request.pmName},\n\n` +
      `${request.employeeName} (${request.employeeEmail}) would like to attend "${item.title}"` +
      `${item.location ? ` in ${item.location}` : ''}${item.startDate ? ` on ${item.startDate}` : ''}.\n\n` +
      `Event link: ${item.url}\n\n` +
      `This is an automated notification from the II Conference & Learning Discovery app. ` +
      `Please follow up with ${request.employeeName} directly to approve or decline.`,
  };
}

export function buildReminderEmail(
  item: DiscoveredItemRow,
  request: InterestRequestRow,
): { subject: string; body: string } {
  return {
    subject: `Reminder: ${item.title} is coming up`,
    body:
      `Hi ${request.employeeName},\n\n` +
      `This is a reminder that "${item.title}" is coming up on ${item.startDate}` +
      `${item.location ? ` in ${item.location}` : ''}.\n\n` +
      `Event link: ${item.url}`,
  };
}

export function buildSystemAlertEmail(topic: TopicRow, error: string): { subject: string; body: string } {
  return {
    subject: `Discovery run failed for topic: ${topic.name}`,
    body:
      `The daily discovery run for topic "${topic.name}" failed with the following error:\n\n${error}\n\n` +
      `Check the Admin > Discovery control screen for details.`,
  };
}
