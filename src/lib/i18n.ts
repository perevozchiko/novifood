/*
  Translation dictionaries for the application.

  Two supported locales: 'en' (default) and 'ru'.
  Choice is persisted to localStorage under key 'lang'.
  Dates and numbers should be formatted via Intl with the locale returned
  by getLocale().
*/

export type Lang = 'en' | 'ru';

/** Returns the BCP 47 locale tag for the given language. */
export function getLocale(lang: Lang): string {
  return lang === 'ru' ? 'ru-RU' : 'en-US';
}

const dict = {
  en: {
    // Navigation
    nav_diary: 'Diary',
    nav_history: 'History',
    nav_weight: 'Weight',
    nav_goals: 'Goals',

    // Diary page
    diary_title: 'NoviFood',
    diary_empty: 'No entries today',
    diary_empty_sub: 'Add your first meal',

    // MacroSummary
    macro_kcal: 'kcal',
    macro_protein: 'Protein',
    macro_fat: 'Fat',
    macro_carbs: 'Carbs',
    macro_g: 'g',
    macro_goal: 'Goal:',
    macro_done: '% done',

    // Shared meal type labels
    meal_breakfast: 'Breakfast',
    meal_lunch: 'Lunch',
    meal_dinner: 'Dinner',
    meal_snack: 'Snack',

    // MealCard
    meal_type_placeholder: '— Meal type —',
    meal_field_kcal: 'kcal',
    meal_field_protein: 'protein',
    meal_field_fat: 'fat',
    meal_field_carbs: 'carbs',
    meal_save: 'Save',
    meal_saving: 'Saving…',
    meal_cancel: 'Cancel',
    meal_edit_aria: 'Edit',
    meal_delete_aria: 'Delete',
    meal_p_abbr: 'P',
    meal_f_abbr: 'F',
    meal_c_abbr: 'C',

    // AddMealForm
    add_open_btn: 'Add meal',
    add_title: 'New meal entry',
    add_name_placeholder: 'Dish name',
    add_name_error: 'Enter dish name',
    add_save_error: 'Failed to save. Try again.',
    add_add: 'Add',
    add_protein_label: 'Protein, g',
    add_fat_label: 'Fat, g',
    add_carbs_label: 'Carbs, g',

    // CameraUpload
    camera_btn: 'Photograph dish',
    camera_analysing: 'Analysing photo…',
    camera_reset: 'Reset',
    camera_add_to_diary: 'Add to diary',
    camera_save_error: 'Failed to save. Try again.',

    // PortionSelector
    portion_label: 'Portion size',

    // HistoryClient
    history_title: 'History',
    history_prev_day: 'Previous day',
    history_next_day: 'Next day',
    history_today: 'Today',
    history_loading: 'Loading…',
    history_empty: 'No entries for this day',
    history_total: 'Total for the day:',

    // WeightClient
    weight_title: 'Weight',
    weight_latest: 'Latest value',
    weight_kg: 'kg',
    weight_trend: 'Weight trend',
    weight_label: 'Weight, kg',
    weight_error_invalid: 'Enter a valid weight (kg)',
    weight_error_save: 'Failed to save. Try again.',
    weight_add: 'Add',
    weight_adding: '…',
    weight_no_entries: 'No entries. Add first value.',

    // SettingsClient
    settings_title: 'Macro Goals',
    settings_subtitle: 'Your daily targets',
    settings_calories: 'Calories',
    settings_protein: 'Protein',
    settings_fat: 'Fat',
    settings_carbs: 'Carbs',
    settings_kcal: 'kcal',
    settings_g: 'g',
    settings_save_error: 'Failed to save. Try again.',
    settings_saved: 'Goals saved ✓',
    settings_saving: 'Saving…',
    settings_save: 'Save',
  },
  ru: {
    // Navigation
    nav_diary: 'Дневник',
    nav_history: 'История',
    nav_weight: 'Вес',
    nav_goals: 'Цели',

    // Diary page
    diary_title: 'NoviFood',
    diary_empty: 'Записей за сегодня нет',
    diary_empty_sub: 'Добавьте первый приём пищи',

    // MacroSummary
    macro_kcal: 'ккал',
    macro_protein: 'Белки',
    macro_fat: 'Жиры',
    macro_carbs: 'Углеводы',
    macro_g: 'г',
    macro_goal: 'Цель:',
    macro_done: '% выполнено',

    // Shared meal type labels
    meal_breakfast: 'Завтрак',
    meal_lunch: 'Обед',
    meal_dinner: 'Ужин',
    meal_snack: 'Перекус',

    // MealCard
    meal_type_placeholder: '— Тип приёма пищи —',
    meal_field_kcal: 'ккал',
    meal_field_protein: 'белки',
    meal_field_fat: 'жиры',
    meal_field_carbs: 'углев.',
    meal_save: 'Сохранить',
    meal_saving: 'Сохранение…',
    meal_cancel: 'Отмена',
    meal_edit_aria: 'Редактировать',
    meal_delete_aria: 'Удалить',
    meal_p_abbr: 'Б',
    meal_f_abbr: 'Ж',
    meal_c_abbr: 'У',

    // AddMealForm
    add_open_btn: 'Добавить блюдо',
    add_title: 'Новый приём пищи',
    add_name_placeholder: 'Название блюда',
    add_name_error: 'Введите название блюда',
    add_save_error: 'Не удалось сохранить. Попробуйте снова.',
    add_add: 'Добавить',
    add_protein_label: 'Белки, г',
    add_fat_label: 'Жиры, г',
    add_carbs_label: 'Углев., г',

    // CameraUpload
    camera_btn: 'Сфотографировать блюдо',
    camera_analysing: 'Анализирую фото…',
    camera_reset: 'Сбросить',
    camera_add_to_diary: 'Добавить в дневник',
    camera_save_error: 'Не удалось сохранить. Попробуйте снова.',

    // PortionSelector
    portion_label: 'Размер порции',

    // HistoryClient
    history_title: 'История',
    history_prev_day: 'Предыдущий день',
    history_next_day: 'Следующий день',
    history_today: 'Сегодня',
    history_loading: 'Загрузка…',
    history_empty: 'Нет записей за этот день',
    history_total: 'Итого за день:',

    // WeightClient
    weight_title: 'Вес',
    weight_latest: 'Последнее значение',
    weight_kg: 'кг',
    weight_trend: 'Динамика веса',
    weight_label: 'Вес, кг',
    weight_error_invalid: 'Введите корректный вес (кг)',
    weight_error_save: 'Не удалось сохранить. Попробуйте снова.',
    weight_add: 'Добавить',
    weight_adding: '…',
    weight_no_entries: 'Нет записей. Добавьте первое значение.',

    // SettingsClient
    settings_title: 'Цели КБЖУ',
    settings_subtitle: 'Ваши дневные нормы',
    settings_calories: 'Калории',
    settings_protein: 'Белки',
    settings_fat: 'Жиры',
    settings_carbs: 'Углеводы',
    settings_kcal: 'ккал',
    settings_g: 'г',
    settings_save_error: 'Не удалось сохранить. Попробуйте снова.',
    settings_saved: 'Цели сохранены ✓',
    settings_saving: 'Сохранение…',
    settings_save: 'Сохранить',
  },
} as const;

export type TranslationKey = keyof typeof dict.en;

/** A map from every translation key to a string value. */
export type Translations = Record<TranslationKey, string>;

/** Returns the full translation map for the given language. */
export function getTranslations(lang: Lang): Translations {
  return dict[lang] as Translations;
}
