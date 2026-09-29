# Step 6 — the null test

**What changed from step 0:** politeness and urgency. Nothing else. The same
bare query, but no role, no schema, no constraints, no format — this is the
*baseline* with manners, not a continuation of step 5.

**Why it is here:** every other file in this folder adds information. This one
adds none, and it exists so you can see the difference between the two kinds of
edit. "Please", "this is important", "my job depends on this" and outright
threats are **style tokens**. They carry no facts about your schema, and a
next-token predictor has nothing new to condition on.

**What to watch:** the wording will probably change — possibly more hedging,
possibly a more formal register, possibly a longer preamble. The *content*
almost certainly will not. Compare it against `00-baseline.md`, not against
step 5.

If it does change the content in some way you can defend, that is the most
interesting finding anyone will have today. Write it down precisely.

**Why this matters beyond the lab:** every component you build in the rest of
this course — tools, memory, context management, skills — is a mechanism for
getting the *right material* in front of the model. None of them is a mechanism
for asking nicely. If politeness worked, the course would be one session long.

> **`/clear` first.** Every prompt is a fresh conversation — see `README.md`.

---

Please, I really need your help with this. This is extremely important and my
job depends on getting it right, so please think very carefully.

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
