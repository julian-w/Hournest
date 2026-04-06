import { Locator } from '@playwright/test';

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nextBusinessDayOffset(baseOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + baseOffset);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return toLocalIsoDate(date);
}

export function toUsDateInputValue(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

export async function fillDateInput(locator: Locator, isoDate: string): Promise<void> {
  await locator.fill(toUsDateInputValue(isoDate));
  await locator.dispatchEvent('input');
  await locator.dispatchEvent('change');
}

export function currentWeekIsoDates(weekOffset = 0): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return toLocalIsoDate(date);
  });
}

export function nextBusinessDaySequence(length: number, startOffset = 1): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + startOffset);

  while (dates.length < length) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(toLocalIsoDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function isWeekendIsoDate(isoDate: string): boolean {
  const date = new Date(`${isoDate}T12:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function toTemplateDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const [year, month, day] = isoDate.split('-');
  void year;
  return `${weekday} ${day}.${month}.`;
}
