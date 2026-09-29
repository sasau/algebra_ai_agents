---
paths:
  - "**/*.sql"
  - "slow-query.md"
---
# SQL review
- Assume PostgreSQL 16.
- For every fix, name the index it needs — or say that it needs none.
- Flag any function wrapped around a column in WHERE: it stops an index on
  that column from being used.
