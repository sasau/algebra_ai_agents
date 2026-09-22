# Step 5 — ask for the reasoning first

**What changed from step 4:** the model must state its reading of the current
query plan *before* it proposes anything.

**Why it matters:** a wrong assumption hides very comfortably underneath a
confident, well-written conclusion. Forcing the assumptions onto the page is
the cheapest way to catch a fix that is technically sound but aimed at the
wrong problem — and it is the only one of the six parts that helps *you* audit
*it*, rather than helping it answer.

**What to watch:** read the stated plan before you read the recommendations.
If the model's picture of what is happening today is wrong — if it thinks an
index is being used that is not, or misses that `DATE(sent_at)` blocks one —
then every recommendation after it inherits that error. Sometimes the reasoning
is the only part worth keeping.

This is also the first honest look at something Session 13 makes formal: you
cannot evaluate an answer you cannot see the workings of.

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

Before answering, state what you believe the query planner is doing today and
why it is slow — which indexes it can and cannot use, and roughly how many rows
it has to touch.

Then give me three options, ranked by expected speedup, as a JSON array where
each element is {"fix": string, "reason": string, "risk": string}.
