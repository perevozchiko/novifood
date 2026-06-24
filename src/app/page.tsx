/*
  Main diary screen — shows today's meals and macro summary.

  Day 1 placeholder: renders an empty state until the full
  MacroSummary + AddMealForm components are built on Day 2.
*/

export default function HomePage() {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-green-700">NoviFood</h1>
        <p className="text-sm text-gray-500 capitalize">{today}</p>
      </header>

      {/* Macro summary placeholder */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 text-center text-gray-400">
        <p className="text-sm">КБЖУ за сегодня появится здесь</p>
      </div>

      {/* Meals list placeholder */}
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
        <p className="text-3xl mb-2">🥗</p>
        <p className="text-sm">Записей за сегодня нет</p>
        <p className="text-xs mt-1">Добавьте первый приём пищи</p>
      </div>
    </div>
  );
}
