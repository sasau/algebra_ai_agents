import type { PoolClient } from 'pg';
import type { Result } from './result.js';

export interface Ticket {
  ticketId: string;
  title: string;
  status: 'open' | 'investigating' | 'closed';
  reproductionSteps: string;
  expectedBehaviour: string;
  truncated: boolean;
}

export type TicketLookup = (client: PoolClient, ticketId: string) => Promise<Result<Ticket | null>>;

/** Acquisition limits apply in SQL, before node-postgres constructs row objects. */
export const TICKET_SELECT = `SELECT ticket_id AS "ticketId", left(title, 200) AS title,
  status, left(reproduction_steps, 1000) AS "reproductionSteps",
  left(expected_behaviour, 1000) AS "expectedBehaviour",
  (length(title) > 200 OR length(reproduction_steps) > 1000
    OR length(expected_behaviour) > 1000) AS truncated
  FROM lab_api.tickets WHERE ticket_id = $1 LIMIT 1`;

export interface StoredDiagnosticReport {
  reportId: string;
  ticketId: string;
  runId: string;
  summary: string;
  evidenceDigest: string;
  idempotencyKey: string;
  createdAt: string;
}
