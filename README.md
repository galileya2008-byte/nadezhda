# Надя о балансе — сайт

Статический сайт [Надежды Родионовой](https://t.me/nadya_rodionova): главная, обо мне, мастерские, практики, статьи.

**Сайт:** https://nadyarodionova.ru/

## Админка

**Адрес:** https://nadyarodionova.ru/admin/

### Для Нади (без GitHub)

1. Откройте админку → **«Готовлю контент»**.
2. Вкладки **Мастерские и программы** / **Статьи** — добавление и правка.
3. **«Скачать архив для публикации»** — zip с JSON, HTML статей, `sitemap.xml`, `rss.xml`.
4. Отправьте архив тому, кто публикует сайт (сопровождение).

### Для публикации на GitHub

1. **«Публикую на сайт»** → [GitHub-токен](https://github.com/settings/tokens/new?description=Nadya+site+admin&scopes=repo) с доступом **repo** (репозиторий `nadezhda`).
2. Сохранение статей сразу обновляет сайт и файлы для **Яндекса** (sitemap + RSS).

Подробно про индексацию: [docs/YANDEX-INDEX.md](docs/YANDEX-INDEX.md)

## GitHub Pages

Ветка `main`, корень репозитория. Домен: **nadyarodionova.ru**. Файл `.nojekyll` нужен для шаблона в `blog/`.

## Локальный просмотр

```powershell
py -m http.server 8765
```

http://127.0.0.1:8765/ — нужен сервер для JSON и админки в режиме «Готовлю контент».

## Структура

| Раздел | Путь |
|--------|------|
| Главная | `index.html` |
| Обо мне | `about/index.html` |
| С чем приходят | `services/index.html` |
| Мастерские | `workshops/index.html` |
| Практика | `practice/index.html` |
| Статьи | `blog/index.html` |
| Sitemap | `sitemap.xml` |
| RSS | `rss.xml` |

## Контакты

- Канал: [@nadya_o_balanse](https://t.me/nadya_o_balanse)
- Запись: [@nadya_rodionova](https://t.me/nadya_rodionova)
