import { Event } from '../types';

export type EventTimeCategory = 'today' | 'upcoming' | 'ongoing' | 'ended';

export interface CategorizedEvents {
  today: Event[];      // 当日未開催
  upcoming: Event[];   // 明日以降
  ongoing: Event[];    // 開催中
  ended: Event[];      // 終了済み
}

export function categorizeEventsByTime(events: Event[]): CategorizedEvents {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const categorized: CategorizedEvents = {
    today: [],
    upcoming: [],
    ongoing: [],
    ended: []
  };

  events.forEach(event => {
    const startTime = new Date(event.start_datetime);
    const endTime = event.end_datetime ? new Date(event.end_datetime) : startTime;

    if (endTime < now) {
      // 終了済み
      categorized.ended.push(event);
    } else if (startTime <= now && now < endTime) {
      // 開催中
      categorized.ongoing.push(event);
    } else if (startTime >= startOfToday && startTime < startOfTomorrow) {
      // 当日未開催
      categorized.today.push(event);
    } else {
      // 明日以降
      categorized.upcoming.push(event);
    }
  });

  return categorized;
}

export function getEventTimeCategoryLabel(category: EventTimeCategory): string {
  switch (category) {
    case 'today':
      return '🚨 当日開催';
    case 'upcoming':
      return '📅 今後開催';
    case 'ongoing':
      return '🔴 開催中';
    case 'ended':
      return '✅ 終了済み';
  }
}

export function getEventTimeCategoryDescription(category: EventTimeCategory): string {
  switch (category) {
    case 'today':
      return '本日開催予定のイベント';
    case 'upcoming':
      return '明日以降に開催予定のイベント';
    case 'ongoing':
      return '現在開催中のイベント';
    case 'ended':
      return '終了したイベント';
  }
}