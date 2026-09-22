# Step 3 — constrain the answer

**What changed from step 2:** one sentence bounding the *shape* of the reply.
The role stays, the material stays.

**Why it matters:** without constraints you get a wall of prose that you have to
read in full to find the one useful sentence. "Ranked" is the load-bearing word
here — it forces the model to commit to an ordering rather than listing five
equally-weighted ideas and leaving the judgement to you.

**What to watch:** the content may barely change while the *usability* changes a
lot. That is a real result and worth writing down separately: a prompt part can
improve the answer without improving the reasoning behind it.

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

Give me three options, ranked by expected speedup, with one line of
justification each.
