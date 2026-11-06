# Reformas y oficios: presupuestos en PDF

El cliente calcula su reforma por ambiente y pide la visita; el dueño arma presupuestos prolijos con su lista de precios, los manda por WhatsApp y ve cuáles le aceptaron.

**Probala en vivo:** https://reformas-demo-ydk.pages.dev

## Qué tiene

- Calculadora
- Presupuesto en PDF
- Seguimiento

## Tecnologías

- HTML, CSS y JavaScript propios, sin plantillas ni frameworks
- Cloudflare Pages (servida desde la red de Cloudflare, con HTTPS)
- Cloudflare Workers y base de datos D1 (SQLite) para la parte del servidor
- Pensada primero para el celular y probada con pruebas automáticas (Playwright)

## Qué hay en este repositorio

La parte que ve el cliente, en `public/`. La lógica del servidor queda en un repositorio privado.

---

Hecho por Julian, de **Yardak**: webs, tiendas, apps y sistemas para negocios de Paraná, Entre Ríos.
https://yardak.pages.dev
