# Портфолио Вадима Баранова

Статический сайт-портфолио без этапа сборки. Основные файлы:

- `index.html` - структура страницы и контент.
- `styles.css` - визуальный стиль, адаптивность, карточки и аккордеоны.
- `script.js` - активное состояние навигации и поведение аккордеонов.
- `deploy.sh` - деплой на Ubuntu VPS через Nginx.

## Локальный запуск

Откройте `index.html` в браузере или запустите простой локальный сервер:

```bash
python -m http.server 8080
```

После этого сайт будет доступен по адресу `http://localhost:8080`.

## Деплой на VPS

Подключитесь к серверу:

```bash
ssh root@45.38.60.84
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

Скрипт установит Nginx, скачает актуальную версию сайта в `/var/www/portfoliosite`, настроит конфигурацию и перезапустит веб-сервер.

После успешного выполнения откройте в браузере:

```text
http://45.38.60.84
```

## Обновление сайта

После новых изменений в репозитории зайдите на VPS и выполните:

```bash
cd /var/www/portfoliosite
git pull origin main
sudo systemctl reload nginx
```

Если менялась конфигурация Nginx или вы хотите полностью повторить настройку:

```bash
cd /opt/portfoliosite
git pull origin main
./deploy.sh
```
