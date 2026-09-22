# The case — a report query that got slow

This is the material for the **Act 2 prompt lab**. You are not going to run this
SQL; there is no database in this practice. It exists so you have something
*real* to hand a model — a schema it has never seen, with a problem it cannot
guess from the outside.

Read it once, then go back to the deck.

---

## The situation

An internal delivery report runs once a night for each account. It has always
been slow but tolerable. Since the `messages` table passed ~240 million rows it
takes **42 seconds** for a large account, and the nightly job now overruns its
window.

It must come in **under 2 seconds**. Nobody has touched the query in a year.

| table | rows | notes |
|---|---:|---|
| `messages` | ~240,000,000 | ~1.1 M new rows/day, never deleted |
| `contacts` | ~3,100,000 | slow-growing |

PostgreSQL 16. The report is read-only and may be a few minutes stale.

---

## The schema (DDL)

```sql
CREATE TABLE contacts (
    id           BIGSERIAL PRIMARY KEY,
    account_id   BIGINT      NOT NULL,
    msisdn       VARCHAR(20) NOT NULL,
    country_code CHAR(2)     NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
    id           BIGSERIAL PRIMARY KEY,
    account_id   BIGINT      NOT NULL,
    contact_id   BIGINT      NOT NULL REFERENCES contacts (id),
    channel      VARCHAR(16) NOT NULL,   -- 'sms' | 'whatsapp' | 'email'
    status       VARCHAR(16) NOT NULL,   -- 'queued' | 'sent' | 'delivered' | 'failed'
    sent_at      TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    price_micros BIGINT      NOT NULL DEFAULT 0
);

-- every index that exists on messages, in full:
CREATE INDEX idx_messages_contact ON messages (contact_id);
```

That index list is not an abbreviation. Apart from the primary key, that one
index is everything `messages` has.

---

## The query

```sql
SELECT c.country_code,
       COUNT(*)                                                  AS total,
       SUM(CASE WHEN m.status = 'delivered' THEN 1 ELSE 0 END)   AS delivered,
       SUM(m.price_micros) / 1000000.0                           AS cost_eur
FROM messages m
JOIN contacts c ON c.id = m.contact_id
WHERE m.account_id = 4815
  AND DATE(m.sent_at) BETWEEN '2026-09-01' AND '2026-09-21'
  AND LOWER(m.channel) = 'sms'
GROUP BY c.country_code
ORDER BY total DESC;
```

Two extra facts that a model cannot see from the SQL alone, and that you should
decide whether to include in your prompt:

- `channel` is written lowercase by the application on every insert. There are
  no mixed-case values.
- The report always covers a contiguous date range, and always a single
  `account_id`.

---

## Why this file exists

The lab asks you to compare a prompt that *describes* this problem against one
that *pastes* it. The difference is not stylistic. There are facts in here —
which indexes exist, how big the tables are, that `channel` is already
lowercase — that decide which fix is correct, and a model that has not been
shown them will invent a plausible schema and optimise that one instead.

Keep your own answer notes in `findings.md`, not in this file.
