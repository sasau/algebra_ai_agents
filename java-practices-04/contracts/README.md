# Contracts to prepare during planning

Create `transport.md` with the explicit protocol, size, framing, error,
timeout, admission and lifecycle decisions listed in [assignment.md](../assignment.md).
Create `design.md` with the transport-independent interfaces and resource
ownership the separate builders must agree before editing.

The [original application contract](../plans/java03-reference/contracts/http.md)
is the behavioral baseline. The [original design contract](../plans/java03-reference/contracts/design.md)
describes the current JDK-specific classes. The new design must explain
how application behavior survives the changed transport boundary.

No new transport contract is supplied yet: making those decisions and
turning them into verifiable tasks is part of the student's planning work.
