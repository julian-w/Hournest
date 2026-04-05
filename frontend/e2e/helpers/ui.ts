import { Locator } from '@playwright/test';

export function nextBusinessDayOffset(baseOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + baseOffset);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
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

export function currentWeekIsoDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().split('T')[0];
  });
}
