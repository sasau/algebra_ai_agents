import { TICKET_SELECT, type Ticket, type TicketLookup } from '../core/db-types.js';
import { ok } from '../core/result.js';

/** PostgreSQL receives the statement and the value separately. Quotes remain data. */
export const lookupTicket: TicketLookup = async (client, ticketId) => {
  const { rows } = await client.query<Ticket>({
    name: 'lab-ticket-by-id-v1',
    text: TICKET_SELECT,
    values: [ticketId],
  });
  return ok(rows[0] ?? null);
};
