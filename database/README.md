## Database Schema

The database uses PostgreSQL with the tables defined in `schema.sql`. Run the schema and seed scripts to bootstrap a local environment:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

Tables include:

- `roles` – User role definitions.
- `users` – Application users linked to roles and OAuth identifiers.
- `menu_items` – Drinks available for purchase with pricing and availability metadata.
- `orders` and `order_items` – Customer orders with line-level quantities and pricing.
- `payments` – Payment records associated to orders.
- `inventory_items` – Stock tracking for ingredients.
