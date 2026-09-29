# Step 1 — add role & audience

**What changed from step 0:** one sentence naming who is speaking and who is
listening. Nothing else.

**Why it matters:** the role sets vocabulary and depth. Without it the answer is
pitched at nobody in particular — either too shallow to act on, or full of
jargon you cannot check. Note that the *audience* half does as much work as the
*role* half: "for a junior who has never tuned a query" constrains the
explanation far more than "you are a DBA" does on its own.

**What to watch:** the answer will almost certainly get easier to read. Ask
yourself the harder question — did it get any more *correct*? It still has the
same query and still has not seen your schema, so count its guesses about
indexes and data: a confident DBA voice can make a guess sound like a fact.

> **`/clear` first.** Every prompt is a fresh conversation — see `README.md`.

---

You are a PostgreSQL DBA reviewing this for a junior developer who has never
tuned a query before. Explain at that level.

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
