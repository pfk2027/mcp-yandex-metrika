# MCP Yandex Metrika

MCP-сервер для Яндекс Метрики — полное покрытие API через Claude Code (или любой MCP-клиент).

Позволяет AI-ассистенту управлять счётчиками, целями, фильтрами, доступами, строить отчёты, сравнивать периоды, скачивать сырые данные — на естественном языке.

## Возможности (52 инструмента)

### Счётчики и метки (11)

| Тул | Описание |
|-----|----------|
| `counters_get` | Список всех счётчиков Метрики |
| `counter_info` | Подробная информация о счётчике (цели, зеркала, доступы, фильтры) |
| `counter_create` | Создать новый счётчик |
| `counter_update` | Обновить настройки счётчика |
| `counter_delete` | Удалить счётчик (восстановление 30 дней) |
| `counter_undelete` | Восстановить удалённый счётчик |
| `labels_get` | Список меток для организации счётчиков |
| `label_create` | Создать метку |
| `label_update` | Переименовать метку |
| `label_delete` | Удалить метку |
| `counter_label_set` | Привязать метку к счётчику |
| `counter_label_remove` | Убрать метку со счётчика |

### Цели (5)

| Тул | Описание |
|-----|----------|
| `goals_get` | Все цели счётчика — нужны для метрик конверсий |
| `goal_info` | Подробности конкретной цели |
| `goal_create` | Создать цель (URL, событие, составная, и др.) |
| `goal_update` | Обновить цель |
| `goal_delete` | Удалить цель |

### Фильтры и операции (10)

| Тул | Описание |
|-----|----------|
| `filters_get` | Список фильтров трафика |
| `filter_info` | Подробности фильтра |
| `filter_create` | Создать фильтр (исключить IP, URL, рефереры) |
| `filter_update` | Обновить фильтр |
| `filter_delete` | Удалить фильтр |
| `operations_get` | Список операций перезаписи URL |
| `operation_info` | Подробности операции |
| `operation_create` | Создать операцию (обрезка параметров, замена домена) |
| `operation_update` | Обновить операцию |
| `operation_delete` | Удалить операцию |

### Доступы, делегаты, сегменты (13)

| Тул | Описание |
|-----|----------|
| `grants_get` | Список доступов к счётчику |
| `grant_create` | Выдать доступ пользователю (view/edit) |
| `grant_update` | Изменить уровень доступа |
| `grant_delete` | Отозвать доступ |
| `delegates_get` | Список делегатов аккаунта |
| `delegate_add` | Добавить делегата |
| `delegate_delete` | Удалить делегата |
| `accounts_get` | Аккаунты, доступные текущему пользователю |
| `segments_get` | Сохранённые сегменты аудитории |
| `segment_info` | Подробности сегмента |
| `segment_create` | Создать сегмент (фильтр аудитории для отчётов) |
| `segment_update` | Обновить сегмент |
| `segment_delete` | Удалить сегмент |

### Статистика и отчёты (5)

| Тул | Описание |
|-----|----------|
| `stat_data` | Основной отчёт: визиты, пользователи, отказы, конверсии по любым измерениям |
| `stat_bytime` | Таймсерии для графиков (по дням, неделям, месяцам) |
| `stat_comparison` | Сравнение двух периодов бок о бок |
| `stat_drilldown` | Иерархический drill-down (страна -> регион -> город) |
| `stat_comparison_drilldown` | Drill-down + сравнение двух периодов |

### Log API — сырые данные (7)

| Тул | Описание |
|-----|----------|
| `logrequest_estimate` | Оценка размера лог-запроса перед созданием |
| `logrequest_create` | Создать запрос на выгрузку сырых визитов/хитов |
| `logrequest_info` | Проверить статус лог-запроса |
| `logrequests_list` | Список всех лог-запросов |
| `logrequest_download` | Скачать часть готового лог-запроса (TSV) |
| `logrequest_clean` | Удалить обработанный лог-запрос |
| `logrequest_cancel` | Отменить ожидающий лог-запрос |

## Установка

```bash
git clone https://github.com/pfk2027/mcp-yandex-metrika.git
cd mcp-yandex-metrika
npm install
npm run build
```

**Требования:** Node.js 18+ (проверь: `node --version`)

## Получение токена

1. Зайди на [oauth.yandex.ru](https://oauth.yandex.ru/) и создай приложение
2. Укажи право доступа: **Яндекс Метрика** (`metrika:read` + `metrika:write` для управления)
3. Получи OAuth-токен
4. Подробнее: [документация Яндекса](https://yandex.ru/dev/metrika/doc/api2/intro/authorization.html)

## Настройка Claude Code

Добавь в `.mcp.json` или `settings.json`:

```json
{
  "yandex-metrika": {
    "command": "node",
    "args": ["/ПОЛНЫЙ/ПУТЬ/К/mcp-yandex-metrika/build/index.js"],
    "env": {
      "YANDEX_METRIKA_TOKEN": "ваш_OAuth_токен"
    }
  }
}
```

## Примеры использования

После подключения просто пиши в Claude Code:

- *«Покажи все мои счётчики Метрики»*
- *«Создай цель "Заявка" на URL /thank-you для счётчика 12345678»*
- *«Сколько визитов на сайте за последнюю неделю?»*
- *«Какие источники трафика приводят больше всего конверсий?»*
- *«Сравни трафик за февраль и март»*
- *«Исключи мой IP 1.2.3.4 из статистики»*
- *«Выдай доступ user@yandex.ru к счётчику на просмотр»*
- *«Скачай сырые данные визитов за вчера»*
- *«Покажи bounce rate по устройствам за последний месяц»*
- *«Отчёт по UTM-меткам за последние 30 дней»*

## Доступные метрики и измерения

**Популярные метрики:**
- `ym:s:visits` — визиты
- `ym:s:users` — пользователи
- `ym:s:pageviews` — просмотры страниц
- `ym:s:bounceRate` — показатель отказов
- `ym:s:avgVisitDurationSeconds` — средняя длительность визита
- `ym:s:goal<ID>reaches` — достижения цели
- `ym:s:goal<ID>conversionRate` — конверсия цели
- `ym:s:ecommerceAddTransactionRevenue` — доход e-commerce
- `ym:s:ecommerceAddTransactionCount` — количество транзакций

Полный справочник: [метрики и измерения](https://yandex.com/dev/metrika/en/stat/dim-metrics)

**Популярные измерения:**
- `ym:s:date` — дата
- `ym:s:lastSignTrafficSource` — источник трафика
- `ym:s:UTMSource` / `UTMCampaign` / `UTMMedium` — UTM-метки
- `ym:s:deviceCategory` — тип устройства
- `ym:s:regionCity` — город
- `ym:s:gender` — пол
- `ym:s:ageInterval` — возраст
- `ym:s:browser` — браузер
- `ym:s:operatingSystem` — ОС

## Архитектура

```
src/
  config.ts         — конфигурация из env (с override для staging)
  api.ts            — Management API + Stat API + Ctx + HttpError + retry
  schemas.ts        — shared Zod-схемы (ID, даты, метрики, измерения)
  types.ts          — TypeScript-интерфейсы ответов API
  index.ts          — entry point, регистрация модулей
  tools/
    counters.ts     — счётчики + метки (12)
    goals.ts        — цели (5)
    filters.ts      — фильтры + операции (10)
    access.ts       — гранты + делегаты + аккаунты + сегменты (13)
    stat.ts         — отчёты (5)
    logrequests.ts  — Log API (7)
```

```
AI-ассистент  <-- MCP (stdio) -->  MCP-сервер  <-- HTTPS -->  Яндекс Метрика API
```

- Транспорт: stdio (локальный процесс, без сети)
- Авторизация: OAuth 2.0 через переменную окружения
- Без хранения данных — сервер stateless

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `YANDEX_METRIKA_TOKEN` | да | OAuth-токен для Яндекс Метрики |
| `YANDEX_METRIKA_MGMT_BASE` | нет | Override базового URL Management API |
| `YANDEX_METRIKA_STAT_BASE` | нет | Override базового URL Stat API |

## Troubleshooting

| Ошибка | Причина | Решение |
|---|---|---|
| `401 Unauthorized` | Невалидный или просроченный токен | Перевыпусти токен на oauth.yandex.ru |
| `403 Forbidden` | Нет доступа к счётчику или недостаточно скоупов | Проверь права: `metrika:read` (аналитика) + `metrika:write` (управление) |
| `429 Too Many Requests` | Превышен лимит запросов API | Подожди и повтори. Лимиты: [документация](https://yandex.com/dev/metrika/en/intro/quotas) |
| Timeout | API не отвечает за 30 сек | Проверь интернет. Для больших отчётов уменьши `limit` |

## Лицензия

MIT
