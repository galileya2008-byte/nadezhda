# Надя о балансе — сайт

Статический сайт [Надежды Родионовой](https://t.me/nadya_rodionova): главная, обо мне, мастерские, практики, статьи.

## GitHub Pages

1. Создайте репозиторий и загрузите файлы в **корень** (ветка `main`).
2. **Settings → Pages → Source:** branch `main`, folder `/ (root)`.
3. Сайт: `https://ВАШ-ЛОГИН.github.io/ИМЯ-РЕПО/`
4. Перед публикацией замените `example.ru` в `sitemap.xml`, `robots.txt` и `canonical` на страницах.

Файл `.nojekyll` нужен, чтобы GitHub не скрывал `blog/_SHABLON-stati.html`.

## Локальный просмотр

```powershell
py -m http.server 8765
```

Откройте http://127.0.0.1:8765/ (нужен сервер для списков статей и мастерских из JSON).

## Структура

| Раздел | Путь |
|--------|------|
| Главная | `index.html` |
| Обо мне | `about/index.html` |
| С чем приходят | `services/index.html` |
| Мастерские | `workshops/index.html` |
| Практика | `practice/index.html` |
| Статьи | `blog/index.html` |

## Админка (для Нади)

**Адрес:** https://galileya2008-byte.github.io/nadezhda/admin/

1. Откройте админку в браузере.
2. Создайте [GitHub-токен](https://github.com/settings/tokens/new?description=Nadya+site+admin&scopes=repo) с доступом **repo** (или только к репозиторию `nadezhda`).
3. Вставьте токен и нажмите «Войти» — загрузятся текущие мастерские и статьи.
4. Вкладка **Мастерские** — добавление и редактирование расписания.
5. Вкладка **Статьи** — заголовок, описание, текст (можно с `##` для подзаголовков).
6. Нажмите «Сохранить» — изменения уйдут на GitHub, сайт обновится через 1–2 минуты.

Токен хранится только в браузере. Ссылку на админку лучше не публиковать в открытом доступе.

### Вручную (если админка недоступна)

**Статья:** запись в `data/articles.json` + копия `blog/_SHABLON-stati.html` → `blog/ваш-slug.html`.

**Мастерская:** объект в `data/workshops.json`.

## Контакты

- Канал: [@nadya_o_balanse](https://t.me/nadya_o_balanse)
- Запись: [@nadya_rodionova](https://t.me/nadya_rodionova)
