import type { TicketLookup } from '../core/db-types.js';
import { fail } from '../core/result.js';

/** TODO 04: bind ticketId as a value to TICKET_SELECT; never concatenate it into SQL.
 * The supplied SQL selects only the scoped view and bounds text before acquisition.
 * Return ok(rows[0] ?? null). Preserve the contract for a missing ticket.
 */
export const lookupTicket: TicketLookup = async (_client, _ticketId) => {
  return fail('NOT_IMPLEMENTED', 'Complete student/04-ticket-query.ts: bind the ticket lookup parameter.');
};
