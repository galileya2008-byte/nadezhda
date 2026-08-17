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

## Новая статья

1. Запись в `data/articles.json`
2. Копия `blog/_SHABLON-stati.html` → `blog/ваш-slug.html`, правка текста и meta

## Новая мастерская

Добавьте объект в `data/workshops.json` (поля: title, excerpt, dateLabel, status, price, telegramText).

## Контакты

- Канал: [@nadya_o_balanse](https://t.me/nadya_o_balanse)
- Запись: [@nadya_rodionova](https://t.me/nadya_rodionova)
