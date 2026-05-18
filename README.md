# Портфолио Вадима Баранова

Статический сайт-портфолио с контент-слоем, подготовленным под Decap CMS. Основные файлы:

- `content/home.json` - контент главной страницы.
- `content/cases/*.json` - контент страниц кейсов и карточек на главной.
- `tools/build-site.mjs` - сборка `index.html` и `cases/*.html` из контента.
- `admin/` - заготовка Decap CMS для редактирования контента через браузер.
- `index.html` и `cases/*.html` - сгенерированные страницы.
- `styles.css` - визуальный стиль, адаптивность, карточки и аккордеоны.
- `script.js` - активное состояние навигации, карусель кейсов и лайтбокс.
- `deploy.sh` - деплой на Ubuntu VPS через Nginx.

## Локальный запуск

Перед просмотром после правок контента соберите сайт:

```bash
npm run build
```

Если `npm` локально недоступен, можно запустить сборщик напрямую:

```bash
node tools/build-site.mjs
```

Затем откройте `index.html` в браузере или запустите простой локальный сервер:

```bash
python -m http.server 8080
```

После этого сайт будет доступен по адресу `http://localhost:8080`.

## Редактирование контента

Для обычных правок текстов и картинок меняйте файлы в `content/`, а затем запускайте:

```bash
npm run build
```

Альтернатива без `npm`:

```bash
node tools/build-site.mjs
```

Главная страница редактируется в `content/home.json`. Кейсы лежат в `content/cases/*.json`. Поле `card` внутри кейса отвечает за карточку на главной, а `bodyHtml` - за полный текст страницы кейса.

## Decap CMS

Заготовка админки находится по адресу `/admin/`. Конфигурация Decap лежит в `admin/config.yml`.

Сейчас проект подготовлен структурно: Decap знает, какие JSON-файлы редактировать, куда складывать загруженные изображения и какие поля показывать в интерфейсе. Для полноценного входа через GitHub на VPS ещё нужно настроить GitHub OAuth proxy и добавить его адрес в `admin/config.yml`.

## Деплой на VPS

Подключитесь к серверу:

```bash
ssh root@185.92.181.109
```

Установите git, скачайте репозиторий и запустите скрипт:

```bash
apt update
apt install -y git
git clone https://github.com/iReink/portfoliosite.git /opt/portfoliosite
cd /opt/portfoliosite
chmod +x deploy.sh
./deploy.sh
```

Скрипт установит Nginx и Node.js, скачает актуальную версию сайта в `/var/www/portfoliosite`, соберёт HTML из `content/`, настроит конфигурацию и перезапустит веб-сервер. Его можно запускать и под `root`, и под обычным пользователем с доступом к `sudo`.

После успешного выполнения откройте в браузере:

```text
http://vbaranov.tech
```

## Обновление сайта

После новых изменений в репозитории зайдите на VPS и выполните:

```bash
cd /var/www/portfoliosite
git pull origin main
npm run build
sudo systemctl reload nginx
```

Если менялась конфигурация Nginx или вы хотите полностью повторить настройку:

```bash
cd /opt/portfoliosite
git pull origin main
./deploy.sh
```

Если на сервере включён firewall UFW, откройте HTTP-трафик:

```bash
ufw allow 'Nginx HTTP'
```

## HTTPS

Перед выпуском сертификата убедитесь, что DNS-записи `A` для `vbaranov.tech` и `www.vbaranov.tech` указывают на `185.92.181.109`. Если используете IPv6, `AAAA` должен указывать на IPv6 VPS: `2a13:7c00:8:2:f816:3eff:fec3:70d6`.

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d vbaranov.tech -d www.vbaranov.tech
certbot renew --dry-run
```

Если сертификат получен вручную через DNS challenge, повторно запустите деплой-скрипт. Он увидит файлы сертификата в `/etc/letsencrypt/live/vbaranov.tech` и включит HTTPS в Nginx:

```bash
cd /opt/portfoliosite
git pull origin main
./deploy.sh
```
