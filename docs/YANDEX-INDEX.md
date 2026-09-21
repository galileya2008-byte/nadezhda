# Индексация статей в Яндексе

Сайт: https://galileya2008-byte.github.io/nadezhda/

## Один раз: подключить сайт

1. [Яндекс.Вебмастер](https://webmaster.yandex.ru/) → **Добавить сайт** → укажите URL сайта.
2. Подтвердите права (мета-тег в `index.html` или файл `yandex_XXXX.html` в корне репозитория).
3. **Индексирование → Файлы Sitemap** → добавьте:
   ```
   https://galileya2008-byte.github.io/nadezhda/sitemap.xml
   ```
4. **Индексирование → RSS-каналы** (необязательно, но полезно):
   ```
   https://galileya2008-byte.github.io/nadezhda/rss.xml
   ```

## После каждой новой статьи

Админка при публикации обновляет:

- `blog/ваш-slug.html` — страница с title, description, canonical, Open Graph, разметкой Article
- `data/articles.json` — список на сайте
- `sitemap.xml` — URL статьи с датой `lastmod`
- `rss.xml` — лента для поисковиков

**Дополнительно в Вебмастере (ускоряет появление в поиске):**

1. **Индексирование → Переобход страниц**
2. Добавьте URL новой статьи, например:
   `https://galileya2008-byte.github.io/nadezhda/blog/moya-statya.html`
3. Можно отправить и sitemap ещё раз, если прошло много времени.

Обычно страница попадает в индекс от нескольких дней до 2–3 недель; переобход часто ускоряет процесс.

## Проверка

- В Вебmaster: **Поисковые запросы / Страницы в поиске**
- В браузере: `site:galileya2008-byte.github.io/nadezhda` в Яндексе

## robots.txt

Файл `robots.txt` уже указывает на sitemap. Админка (`/admin/`) закрыта от индексации.
