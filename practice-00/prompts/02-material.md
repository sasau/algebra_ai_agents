# Step 2 — give it the material

**What changed from step 1:** the actual schema, the actual index list, the
actual row counts, and the actual query are now *in* the prompt. Pasted, not
described.

**Why it matters:** this is the step that usually wins by a distance — often by
more than the other four combined. A model cannot reason about a schema it has
never seen. Everything before this point was the model answering a question
about *queries in general*, because that is all you gave it.

**What to watch:** this is where the answer typically stops being advice and
starts naming **your** columns — `DATE(sent_at)` wrapping an indexed column so
no index can be used, the missing composite on `(account_id, sent_at)`,
`LOWER(channel)` being redundant because the application already writes
lowercase. If that shift happens here, note it; if it happened earlier or
later for you, note that instead. Either way it is a result.

Three facts below are invisible in the SQL itself and decide which fix is
correct: the table has **exactly one** index, the tables are 240 M and 3.1 M
rows, and `channel` is already lowercase on every insert. A model shown none of
them still answers confidently — it just answers about a different database.

> **`/clear` first.** Every prompt is a fresh conversation — see `README.md`.

---

You are a PostgreSQL DBA reviewing this for a junior developer who has never
tuned a query before. Explain at that level.

Here is the schema:

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

-- every index on messages, in full:
CREATE INDEX idx_messages_contact ON messages (contact_id);
```

Facts about the data and the workload:

- `messages` has ~240,000,000 rows and grows by ~1.1 M/day. Nothing is deleted.
- `contacts` has ~3,100,000 rows and grows slowly.
- `channel` is written lowercase by the application on every insert. There are
  no mixed-case values.
- The report always covers a contiguous date range, and always a single
  `account_id`.
- PostgreSQL 16. The report is read-only and may be a few minutes stale.
- It currently takes 42 seconds and must come in under 2.

And here is the query:

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

How do I speed up this query?
