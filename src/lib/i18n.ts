/*
  Lightweight i18n for two locales: English (default) and Russian.

  Usage:
    const t = useT();
    t('nav.diary') // → "Diary" | "Дневник"

  Date and number formatting goes through Intl utilities at the bottom.
*/

export type Locale = 'en' | 'ru';

const dictionaries = {
  en: {
    // Navigation
    'nav.diary': 'Diary',
    'nav.history': 'History',
    'nav.weight': 'Weight',
    'nav.goals': 'Goals',

    // Home / Diary
    'diary.empty': 'No entries today',
    'diary.emptyHint': 'Add your first meal',

    // MacroSummary
    'macro.calories': 'kcal',
    'macro.protein': 'Protein',
    'macro.fat': 'Fat',
    'macro.carbs': 'Carbs',
    'macro.goal': 'of {0}',

    // MealCard
    'meal.edit': 'Редактировать',
    'meal.delete': 'Delete',
    'meal.save': 'Save',
    'meal.cancel': 'Cancel',
    'meal.name': 'Name',
    'meal.type': 'Type',
    'meal.calories': 'kcal',
    'meal.protein': 'Protein, g',
    'meal.fat': 'Fat, g',
    'meal.carbs': 'Carbs, g',
    'meal.type.breakfast': 'Breakfast',
    'meal.type.lunch': 'Lunch',
    'meal.type.dinner': 'Dinner',
    'meal.type.snack': 'Snack',
    'meal.notes': 'Notes',
    'meal.notesPlaceholder': 'Optional notes…',

    // AddMealForm
    'addMeal.button': 'Add meal',
    'addMeal.title': 'Add meal',
    'addMeal.name': 'Dish name',
    'addMeal.namePlaceholder': 'Dish name',
    'addMeal.type': 'Meal type',
    'addMeal.type.breakfast': 'Breakfast',
    'addMeal.type.lunch': 'Lunch',
    'addMeal.type.dinner': 'Dinner',
    'addMeal.type.snack': 'Snack',
    'addMeal.calories': 'Calories, kcal',
    'addMeal.protein': 'Protein, g',
    'addMeal.fat': 'Fat, g',
    'addMeal.carbs': 'Carbs, g',
    'addMeal.add': 'Add',
    'addMeal.adding': 'Adding…',
    'addMeal.cancel': 'Cancel',
    'addMeal.errorName': 'Enter dish name',
    'addMeal.errorCalories': 'Enter calories',

    // CameraUpload
    'camera.button': 'Recognise with AI',
    'camera.analysing': 'Analysing…',
    'camera.confirm': 'Add to diary',
    'camera.confirmAdding': 'Adding…',
    'camera.retry': 'Try again',
    'camera.cancel': 'Cancel',
    'camera.errorAnalysis': 'Failed to analyse photo. Please try again.',
    'camera.errorQuota': 'AI limit reached. Try again in a few minutes.',
    'camera.errorSave': 'Failed to save.',
    'camera.portion': 'Portion',

    // PortionSelector
    'portion.label': 'Portion',

    // History
    'history.title': 'History',
    'history.today': 'Today',
    'history.empty': 'No entries for this day',
    'history.total': 'Day total: {0} kcal',
    'history.loading': 'Loading…',

    // Weight
    'weight.title': 'Weight',
    'weight.latest': 'Latest',
    'weight.kg': 'kg',
    'weight.trend': 'Weight trend',
    'weight.label': 'Weight, kg',
    'weight.add': 'Add',
    'weight.adding': 'Adding…',
    'weight.empty': 'No entries. Add your first weight.',
    'weight.errorInvalid': 'Enter a valid weight (kg)',
    'weight.errorSave': 'Failed to save. Try again.',
    'weight.deleteAria': 'Delete entry',
    'weight.deleteError': 'Failed to delete. Try again.',

    // Settings
    'settings.title': 'Daily Goals',
    'settings.subtitle': 'Your daily targets',
    'settings.calories': 'Calories',
    'settings.protein': 'Protein',
    'settings.fat': 'Fat',
    'settings.carbs': 'Carbs',
    'settings.kcal': 'kcal',
    'settings.g': 'g',
    'settings.save': 'Save',
    'settings.saving': 'Saving…',
    'settings.saved': 'Goals saved ✓',
    'settings.errorSave': 'Failed to save. Try again.',

    // Stats
    'nav.stats': 'Stats',
    'stats.title': 'Weekly Statistics',
    'stats.last7': 'Last 7 days',
    'stats.avgDay': 'Daily average',
    'stats.goal': 'Goal',
    'stats.calories': 'kcal',
    'stats.protein': 'Protein',
    'stats.fat': 'Fat',
    'stats.carbs': 'Carbs',
    'stats.noData': 'No data for this period',
    'stats.totalWeek': 'Total for the week',
    'stats.streak': 'Day streak',
    'stats.streakDays': '{0} d',

    // AddMealForm — recent meals
    'addMeal.recent': 'Recent',
  },
  ru: {
    // Navigation
    'nav.diary': 'Дневник',
    'nav.history': 'История',
    'nav.weight': 'Вес',
    'nav.goals': 'Цели',

    // Home / Diary
    'diary.empty': 'Записей за сегодня нет',
    'diary.emptyHint': 'Добавьте первый приём пищи',

    // MacroSummary
    'macro.calories': 'ккал',
    'macro.protein': 'Белки',
    'macro.fat': 'Жиры',
    'macro.carbs': 'Углеводы',
    'macro.goal': 'из {0}',

    // MealCard
    'meal.edit': 'Редактировать',
    'meal.delete': 'Удалить',
    'meal.save': 'Сохранить',
    'meal.cancel': 'Отмена',
    'meal.name': 'Название',
    'meal.type': 'Тип',
    'meal.calories': 'ккал',
    'meal.protein': 'Белки, г',
    'meal.fat': 'Жиры, г',
    'meal.carbs': 'Углеводы, г',
    'meal.type.breakfast': 'Завтрак',
    'meal.type.lunch': 'Обед',
    'meal.type.dinner': 'Ужин',
    'meal.type.snack': 'Перекус',
    'meal.notes': 'Заметки',
    'meal.notesPlaceholder': 'Заметка (необязательно)…',

    // AddMealForm
    'addMeal.button': 'Добавить блюдо',
    'addMeal.title': 'Новый приём пищи',
    'addMeal.name': 'Название блюда',
    'addMeal.namePlaceholder': 'Название блюда',
    'addMeal.type': 'Тип приёма пищи',
    'addMeal.type.breakfast': 'Завтрак',
    'addMeal.type.lunch': 'Обед',
    'addMeal.type.dinner': 'Ужин',
    'addMeal.type.snack': 'Перекус',
    'addMeal.calories': 'Калории, ккал',
    'addMeal.protein': 'Белки, г',
    'addMeal.fat': 'Жиры, г',
    'addMeal.carbs': 'Углеводы, г',
    'addMeal.add': 'Добавить',
    'addMeal.adding': 'Добавление…',
    'addMeal.cancel': 'Отмена',
    'addMeal.errorName': 'Введите название блюда',
    'addMeal.errorCalories': 'Введите калории',

    // CameraUpload
    'camera.button': 'Распознать ИИ',
    'camera.analysing': 'Анализирую…',
    'camera.confirm': 'Добавить в дневник',
    'camera.confirmAdding': 'Добавление…',
    'camera.retry': 'Попробовать снова',
    'camera.cancel': 'Отмена',
    'camera.errorAnalysis': 'Не удалось проанализировать фото. Попробуйте ещё раз.',
    'camera.errorQuota': 'Лимит ИИ исчерпан. Попробуйте через несколько минут.',
    'camera.errorSave': 'Не удалось сохранить.',
    'camera.portion': 'Порция',

    // PortionSelector
    'portion.label': 'Порция',

    // History
    'history.title': 'История',
    'history.today': 'Сегодня',
    'history.empty': 'Нет записей за этот день',
    'history.total': 'Итого за день: {0} ккал',
    'history.loading': 'Загрузка…',

    // Weight
    'weight.title': 'Вес',
    'weight.latest': 'Последнее значение',
    'weight.kg': 'кг',
    'weight.trend': 'Динамика веса',
    'weight.label': 'Вес, кг',
    'weight.add': 'Добавить',
    'weight.adding': '…',
    'weight.empty': 'Нет записей. Добавьте первое значение.',
    'weight.errorInvalid': 'Введите корректный вес (кг)',
    'weight.errorSave': 'Не удалось сохранить. Попробуйте снова.',
    'weight.deleteAria': 'Удалить запись',
    'weight.deleteError': 'Не удалось удалить. Попробуйте снова.',

    // Settings
    'settings.title': 'Цели КБЖУ',
    'settings.subtitle': 'Ваши дневные нормы',
    'settings.calories': 'Калории',
    'settings.protein': 'Белки',
    'settings.fat': 'Жиры',
    'settings.carbs': 'Углеводы',
    'settings.kcal': 'ккал',
    'settings.g': 'г',
    'settings.save': 'Сохранить',
    'settings.saving': 'Сохранение…',
    'settings.saved': 'Цели сохранены ✓',
    'settings.errorSave': 'Не удалось сохранить. Попробуйте снова.',

    // Stats
    'nav.stats': 'Статистика',
    'stats.title': 'Статистика за неделю',
    'stats.last7': 'Последние 7 дней',
    'stats.avgDay': 'Среднее в день',
    'stats.goal': 'Цель',
    'stats.calories': 'ккал',
    'stats.protein': 'Белки',
    'stats.fat': 'Жиры',
    'stats.carbs': 'Углеводы',
    'stats.noData': 'Нет данных за этот период',
    'stats.totalWeek': 'Итого за неделю',
    'stats.streak': 'Дней подряд',
    'stats.streakDays': '{0} д',

    // AddMealForm — recent meals
    'addMeal.recent': 'Недавние',
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)['en'];

/*
  Translate a key for the given locale, interpolating {0}, {1}, … placeholders.
*/
export function translate(locale: Locale, key: TranslationKey, ...args: (string | number)[]): string {
  const dict = dictionaries[locale] as Record<string, string>;
  let str = dict[key] ?? dictionaries['en'][key] ?? key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, String(arg));
  });
  return str;
}

/* Locale-aware date formatter */
export function formatDate(
  locale: Locale,
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    options,
  );
}

/* Locale-aware number formatter */
export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US').format(value);
}
