# VPS Deployment Checklist

## 1) Serverga ulanish

- VS Code Remote SSH orqali VPS ga kiring.
- Ishchi papka: /var/www/aimarafon

## 2) Dependensiyalar

- Node.js 20.x
- npm
- pm2
- nginx
- certbot

## 3) App tayyorlash

- .env.local ni to'ldiring
- npm ci
- npm run typecheck
- npm run build

## 4) App start

- pm2 start deploy/ecosystem.config.cjs
- pm2 save
- pm2 startup

## 5) Reverse proxy

- deploy/nginx.aimarafon.conf.example asosida config yozing
- nginx -t
- systemctl reload nginx

## 6) SSL

- certbot --nginx -d ai.YOUR_DOMAIN

## 7) Tekshiruv

- curl -I https://ai.YOUR_DOMAIN
- Browser: /, /participant, /admin
- pm2 status
- tail -f /var/log/aimarafon/error.log
