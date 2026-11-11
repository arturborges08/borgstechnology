# Borgs Technology

Site e plataforma da Borgs: coleta de vídeo em primeira pessoa no Brasil, sob especificação do comprador, com consentimento assinado e revisão humana de cada clipe.

- `index.html` + `src/landing.*`: site público (EN/PT) com formulário de pedido de piloto.
- `app.html` + `src/main.tsx` + `src/pages/`: área do colaborador e painel admin (React + Supabase).
- `server.mjs`: servidor estático usado no Railway (`npm run build` e depois `npm start`).
- `public/logo-*.svg`: logo. `brand/borgs-brandkit.png`: brand kit.

## Rodar local
```
npm install
npm run build
npm start   # http://localhost:3000
```
