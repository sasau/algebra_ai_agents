# Step 4 — fix the output format

**What changed from step 3:** the reply must now come back in a fixed,
machine-readable shape.

**Why it matters:** without a format, every run comes back shaped differently,
so you cannot compare two answers — or feed either one to code. This is the
step that turns a model from something you *read* into something you can *call*,
and it is the direct ancestor of tool use in Session 02: a tool call is just
JSON the model produced and your code ran.

**What to watch:** two things, in tension. Does the JSON constraint make the
reasoning **worse** — shorter, more clipped, less careful? And does the model
obey the shape exactly, or does it wrap the JSON in an explanatory sentence that
would break `JSON.parse`? Both are common. Take-home Exercise 4 (README §3)
attacks this properly.

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

-- every index that exists on messages, in full:
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

Give me three options, ranked by expected speedup.

Reply only as a JSON array, no prose before or after. Each element must be
exactly: {"fix": string, "reason": string, "risk": string}
