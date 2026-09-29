# Step 0 — the baseline (deliberately bad)

No role. No material. No constraints. No format. Just the query and the
question, the way most people ask it on a bad day: SQL pasted in bare, nothing
about the database around it.

**Do not improve this prompt.** It is the control you measure everything else
against. Paste it exactly, save the answer verbatim, then move on.

What you should expect back: a competent, well-organised answer that gets
right what it can *see* and guesses the rest. `DATE(sent_at)` is in the SQL,
so it will probably spot that the function blocks an index. What it cannot see
is the database under the query: which indexes exist (exactly one, on
`contact_id`), how big the tables are (240 M rows), and that `channel` is
already lowercase. So watch for the guesses — *"make sure `account_id` is
indexed"*, *"add an expression index on `LOWER(channel)`"* — advice about a
schema the model imagined. That is the trap — **a guess and a fact are equally
fluent.**

> **`/clear` first.** Every prompt is a fresh conversation — see `README.md`.

---

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
