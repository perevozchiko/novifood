'use client';

/*
  TodayDate — client component that formats and displays today's date.

  Lives on the client so it reads the current date at render time (not
  during static prerendering) and always shows the correct day.
*/

export default function TodayDate() {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return <p className="text-sm text-gray-500 capitalize">{today}</p>;
}
