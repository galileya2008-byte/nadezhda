# Индексация статей в Яндексе

Сайт: https://nadyarodionova.ru/

## Один раз: подключить сайт

1. [Яндекс.Вебмастер](https://webmaster.yandex.ru/) → **Добавить сайт** → `https://nadyarodionova.ru/`
2. Подтвердите права (мета-тег уже есть на странице «Статьи», при необходимости добавьте на главную).
3. **Индексирование → Файлы Sitemap**:
   ```
   https://nadyarodionova.ru/sitemap.xml
   ```
4. **Индексирование → RSS-каналы** (рекомендуется):
   ```
   https://nadyarodionova.ru/rss.xml
   ```

## После новой мастерской или программы

При сохранении в админке обновляются `workshops/slug.html` и URL в `sitemap.xml`. В Вебmaster отправьте переобход, например:

`https://nadyarodionova.ru/workshops/ваш-slug.html`

## После каждой новой статьи

Админка при публикации обновляет:

- `blog/ваш-slug.html` — title, description, canonical, Open Graph, JSON-LD Article
- `data/articles.json` — список на сайте
- `sitemap.xml` — URL статьи с `lastmod`
- `rss.xml` — лента

**Ускорить появление в поиске:**

1. **Индексирование → Переобход страниц**
2. URL новой статьи, например: `https://nadyarodionova.ru/blog/moya-statya.html`

## Проверка

- Яндекс.Вебmaster → страницы в поиске
- Запрос: `site:nadyarodionova.ru`

## robots.txt

Sitemap указан для всех роботов; для Yandex и YandexBot — полный доступ. Админка `/admin/` закрыта от индексации.
