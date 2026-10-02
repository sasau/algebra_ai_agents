#!/usr/bin/env bash
# break-it.sh — Rule 3, demonstrated: a goal with no success test never stops on its own.
#
# run.sh's goal has two halves of a stopping condition: a SUCCESS TEST ("stop when it is
# green" — npm test exits 0) and a BUDGET (--max-turns, --max-budget-usd). This script hands
# the same bot a goal whose success test can never check true:
#
#   "Keep improving this parser forever. Never stop; there is always something to improve."
#
# There is no state of the world in which "forever" is finished, so the model will never
# declare the goal met. The ONLY thing that can halt this loop is the budget half — 6 turns
# or $0.50, whichever comes first. That is the whole point: a budget is not a nice-to-have
# next to the success test, it is the other half of the stopping condition, and the half that
# saves you when the goal is bad. Watch which one fires, and write it down.
#
#   ./break-it.sh        (needs the key, like run.sh; costs at most $0.50)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export GOAL="Keep improving this parser forever. Never stop; there is always something to improve."
export MAX_TURNS=6
export MAX_BUDGET=0.50
# Keep this run's evidence apart from run.sh's: part 3 of agent-anatomy.md needs BOTH.
export OUT_NAME=out-break-it

"$SCRIPT_DIR/run.sh"

# Which half of the stopping condition halted it? Read the bot's report. subtype is on the
# SDK result type: error_max_turns / error_max_budget_usd / success / error_during_execution.
echo
node -e '
  const fs = require("fs");
  const p = process.argv[1];
  let r;
  try { r = JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) {
    console.log("== could not read " + p + " — see the output above and out-break-it/stderr.txt");
    process.exit(0);
  }
  if (Array.isArray(r)) r = r.find((x) => x && x.type === "result") || r[r.length - 1];
  const turns = r.num_turns, cost = r.total_cost_usd, sub = r.subtype, term = r.terminal_reason;
  console.log("== break-it verdict");
  console.log("   subtype         " + JSON.stringify(sub));
  if (term !== undefined) console.log("   terminal_reason " + JSON.stringify(term));
  console.log("   num_turns       " + JSON.stringify(turns) + "   (limit was " + process.env.MAX_TURNS + ")");
  console.log("   total_cost_usd  " + JSON.stringify(cost) + "   (limit was " + process.env.MAX_BUDGET + ")");
  console.log("   is_error        " + JSON.stringify(r.is_error));
  // Which field names the stopper varies by CLI version: the SDK documents it as subtype
  // (error_max_turns / error_max_budget_usd); 2.1.283 also emits terminal_reason. Read both.
  const why = String(sub || "").startsWith("error_") ? sub : (term || sub || "");
  if (term === "api_error" || (r.is_error && cost === 0)) {
    console.log("-> the run never reached the model (API error, nothing spent). Nothing was tested. Read the result text:");
    console.log("   " + String(r.result).slice(0, 300));
  } else if (/max_turns/.test(why)) {
    console.log("-> the TURN budget halted it. The goal never checked true; --max-turns did the stopping.");
  } else if (/max_budget/.test(why)) {
    console.log("-> the DOLLAR budget halted it. The goal never checked true; --max-budget-usd did the stopping.");
  } else if (sub === "success" && !r.is_error) {
    console.log("-> the model declared itself DONE on a goal that says never stop. Read its result text:");
    console.log("   that is the model overriding the goal, not the goal being met. Still a lesson — note it.");
  } else {
    console.log("-> " + JSON.stringify(why) + ": neither budget fired cleanly. Read out-break-it/stderr.txt and the result text.");
  }
  console.log("Either way: no success test could ever fire for this goal. Only the budget can stop it — Rule 3.");
' "$SCRIPT_DIR/out-break-it/result.json"
