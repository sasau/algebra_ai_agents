# Practice 00 — Intro to LLMs

The first lab of *AI Agents & Automation*. By the end you will have made a real
API call, built a conversation by hand, turned the sampling knobs, and forced
the model to return machine-readable output.

Everything later in the course is a loop around what you build today.

---

## 1. Setup (~10 min)

```bash
cd practice-00
npm install
cp .env.example .env
```

Open `.env` and replace `sk-ant-REPLACE-ME` with your key from
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

Then verify everything works **before writing any code**:

```bash
npm run check
```

You want `ALL CHECKS PASSED`. If a check fails it tells you the fix. The most
common failure is a missing or placeholder key.

> **Your key is a password.** It lives in `.env`, which git ignores. Never paste
> it into a source file, a commit, a screenshot, or a chat. If you leak one,
> revoke it in the Console immediately — deleting the commit is not enough.

---

## 2. The four exercises (~67 min)

| | Command | What you'll see |
|---|---|---|
| **1** | `npm run ex1` | Prompt in → text out → the token meter |
| **2** | `npm run ex2` | The model has no memory. You build it — and watch it get expensive |
| **3** | `npm run ex3` | `temperature` and `max_tokens`, plus a parameter that was removed |
| **4** | `npm run ex4` | A system prompt that forces JSON, and a hallucination in valid JSON |

Run them in order — each builds on the last. Or run all four with `npm run all`.

**Read the source.** Every script is commented to explain *why*, not just what.
The code is the lesson; the output is the evidence.

### What each one is really teaching

1. **`01-first-call.ts`** — the model is a pure function. Text in, text out, no
   state. `usage` is the meter that bills you.
2. **`02-conversation.ts`** — "memory" is not a model feature. It is an array
   you re-send every turn, and it grows. This is the problem Sessions 08 and 11
   exist to solve.
3. **`03-knobs.ts`** — `temperature 0` is what makes a run reproducible, which
   is what makes it testable (Session 13). It also shows a real hazard: the
   `temperature` parameter no longer exists on frontier models, so it 400s on
   `claude-sonnet-5`. Model ids belong in one module, not scattered everywhere.
4. **`04-json.ts`** — structured output is what turns an LLM into a *component*.
   A tool call (Session 02) is just JSON the model produced and your code ran.
   But valid JSON can still be confidently wrong.

---

## 3. Stretch goals (optional)

```bash
npm run stretch:stream    # watch tokens arrive live; measure time-to-first-token
npm run stretch:chat      # a 30-line chatbox with /tokens, /reset, /quit
```

---

## 4. Submit (~13 min)

```bash
cp findings.template.md findings.md
```

Fill it in — it is graded on observation, not on being right. Then check:

- [ ] `npm run check` passes
- [ ] All four exercises run without errors
- [ ] `findings.md` completed: token counts, the temperature effect, one hallucination
- [ ] Your name at the top of `findings.md`
- [ ] **No key in any committed file** (`git status` shows no `.env`)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ANTHROPIC_API_KEY is not set` | no `.env`, or it has the placeholder | `cp .env.example .env`, add your real key |
| `401` from the API | key is wrong, revoked, or has a stray space | re-copy it from the Console |
| `429` | rate limited — the whole class is calling at once | wait a few seconds, retry |
| `400 ... credit balance` | account has no credit | add credit in the Console |
| `Cannot find module` | dependencies not installed | `npm install` |
| `temperature` 400 error | you pointed a script at a frontier model | those models removed the knob — see `src/client.ts` |

---

## Files

```
practice-00/
  src/
    client.ts              shared client + model ids + helpers  ← read this first
    00-check-setup.ts      environment verification
    01-first-call.ts       exercise 1
    02-conversation.ts     exercise 2
    03-knobs.ts            exercise 3
    04-json.ts             exercise 4
    05-stretch-stream.ts   stretch: streaming
    06-stretch-chat.ts     stretch: a chat loop
  findings.template.md     copy to findings.md and fill in
  .env.example             copy to .env and add your key
```
