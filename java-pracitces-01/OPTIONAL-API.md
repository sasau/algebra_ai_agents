# Java 21 Optional — complete public API guide

This reference accompanies slides8–16. It explains expected missing results and
the full class declaration, followed by all20 public method declarations that
Optional itself exposes in Java21, including both orElseThrow overloads. It is
an orientation map; build the worked examples through their staged prompts later.
The declarations below are API notation, not a Java class to compile or copy into
the project. Ordinary inherited Object methods are outside this Optional-specific map.

## The problem: expected absence

A user lookup may find no person, a product lookup may find no stock, and an
empty score set has no maximum. A String return type does not express that the
result may be null. Dereferencing that null can throw NullPointerException.
Optional, introduced in Java8, represents a possibly absent result explicitly.
It does not catch operational failures, validate business rules or force callers
to use it correctly. A database outage and an expected missing row are different
outcomes; do not silently turn every exception into empty.

An Optional object contains one nonnull value or no value. Empty differs from a
null Optional variable, from a present empty String and from a present zero.
The caller chooses an action, a fallback, another lookup or a required-value failure.

## Full class declaration

```java
package java.util;

public final class Optional<T> extends Object
```

- `public`: accessible to callers; no extra library dependency is needed.
- `final`: cannot be subclassed. There is no public constructor; use static factories.
- `T`: the contained reference type, such as String or Integer, not primitive int.
- `U`: a mapped result type; `X`: an exception type in the generic throwing overload.
- In these callbacks, `? super T` permits accepting T and `? extends U` permits
  producing U or a subtype. Function has input/output positions; Consumer accepts
  a value, Predicate tests it, Supplier produces one, and Runnable has no value argument.

## Optional creation — three factories, two result states

Static factories create Optional instances without a public constructor. Choose of only when the argument must already be nonnull; choose ofNullable at a boundary that may supply null. empty explicitly represents no result. All three return Optional<T>, so absence remains a value the caller can compose with instead of a null container.

### empty

```java
public static <T> Optional<T> empty()
```

Create an empty Optional of the inferred type. No argument -> Optional<String> empty. No contained value; a nonnull wrapper exists.

### of

```java
public static <T> Optional<T> of(T value)
```

Wrap a required nonnull value. Ada -> Optional<String> present Ada; null -> NullPointerException, no Optional is returned.

### ofNullable

```java
public static <T> Optional<T> ofNullable(T value)
```

Convert a nullable boundary into present or empty. Ada -> present Ada; null -> Optional<String> empty. This does not validate blanks or other business rules.

Worked later: case01: The first live example demonstrates all three factories and deliberately catches only its intended of(null) failure. These are API-reference examples; students have not built or run them yet.

## Optional presence — inspect state or run an action

Presence queries return booleans; action methods return void. A Consumer receives the contained value, while a Runnable empty action receives no value. These methods let a caller inspect or respond to absence without extracting a value through get. They do not change the Optional, and an empty Optional does not invoke the present-value callback.

### isPresent

```java
public boolean isPresent()
```

True when a value exists. present Ada -> true; empty -> false.

### isEmpty

```java
public boolean isEmpty()
```

True when no value exists. present Ada -> false; empty -> true.

### ifPresent

```java
public void ifPresent(Consumer<? super T> action)
```

Run an action only for a present value. present Ada -> Consumer.accept(Ada); empty -> action SKIPPED. Return void.

### ifPresentOrElse

```java
public void ifPresentOrElse(
    Consumer<? super T> action, Runnable emptyAction)
```

Choose exactly one of two actions. present -> Consumer.accept(Ada); empty -> Runnable.run(), no value argument. Return void.

Worked later: case02: The lookup exercise prints a name or a not-found message. For a value transformation or fallback, use the following families instead of building repeated isPresent/get branches.

## Optional transformation — select, map and compose

These operations keep an Optional result, so later steps can continue to handle absence. A Predicate decides whether a present value remains; a Function maps it to another type. flatMap is used when that function already returns Optional, avoiding an extra container layer. All three skip the callback for empty input, but their callback return contracts differ.

### filter

```java
public Optional<T> filter(
    Predicate<? super T> predicate)
```

Keep the same value only if its predicate is true. Optional[17] -> predicate age >= 18 false -> empty; true keeps the same T. Empty skips predicate.

### map

```java
public <U> Optional<U> map(
    Function<? super T, ? extends U> mapper)
```

Transform a present T to a U and wrap the result. Optional[Ada] -> String.length -> Optional[3]; mapper returns null -> empty. Empty input skips mapper.

### flatMap

```java
public <U> Optional<U> flatMap(
    Function<? super T,
        ? extends Optional<? extends U>> mapper)
```

Compose a function that already returns Optional. Optional<User> -> email lookup -> Optional<String>; one Optional layer. A null mapper result is an error, not empty.

Worked later: cases03,04,05: The live map example traces String to Integer. Follow-up examples then compare predicates and nested lookups; a null map result becomes empty, while a null flatMap result throws NullPointerException.

## Optional fallback — choose a value or another source

Fallback operations differ in both evaluation time and return type. orElse receives an argument already evaluated by Java, even if the Optional is present. orElseGet receives a Supplier and invokes it only for empty input. or also defers its supplier, but that supplier returns an Optional, so the caller can keep composing possible absence.

### orElse

```java
public T orElse(T other)
```

Return the present value or the supplied fallback value. present Ada, orElse(makeGuest()) -> makeGuest runs first, but Ada is returned. Result type T.

### orElseGet

```java
public T orElseGet(Supplier<? extends T> supplier)
```

Compute a fallback only if empty. present Ada -> supplier SKIPPED -> Ada; empty -> supplier invoked -> guest. Result type T.

### or

```java
public Optional<T> or(
    Supplier<? extends Optional<? extends T>> supplier)
```

Try another Optional-producing source only if empty. cache hit -> supplier SKIPPED; cache miss -> alternate Optional lookup. Result remains Optional<T>; alternate may be empty.

Worked later: cases06 and08: The live fallback exercise counts supplier calls. A chosen orElse/orElseGet fallback can itself be null; an or supplier must return a nonnull Optional object.

## Optional extraction — require a value or throw

At a boundary where a value is required, these methods return T when present and throw when empty. get and the no-argument orElseThrow use NoSuchElementException. The supplier overload lets the caller name a domain-specific exception and constructs it only on the empty path. Throwing is a control-flow exit, not an Optional containing an exception.

### get

```java
public T get()
```

Extract the contained value; unsafe if empty is possible. present Ada -> String Ada; empty -> NoSuchElementException. No fallback.

### orElseThrow()

```java
public T orElseThrow()
```

State explicitly that a value is required. present Ada -> String Ada; empty -> NoSuchElementException. Same empty failure as get.

### orElseThrow(supplier)

```java
public <X extends Throwable> T orElseThrow(
    Supplier<? extends X> exceptionSupplier) throws X
```

Supply the required-value failure for this domain. present -> supplier SKIPPED -> Ada; empty -> construct MissingCustomerException -> THROW. X is the exception type.

Worked later: case07: Prefer the explicit required-value operation when that is the intent. The example main catches its expected demonstration exception; Optional itself does not catch it.

## Optional streams and value methods

Optional can join a stream pipeline and participate in ordinary value comparisons. stream contributes zero or one element; equals compares contained values rather than wrapper identity. hashCode supports hash-based collections, but matching hashes do not prove equality or presence. toString is a debugging representation, so its exact format should not become an application data protocol.

### stream

```java
public Stream<T> stream()
```

Expose the present value as a one-element Stream. present Ada -> stream[Ada]; empty -> stream[]. Stream.flatMap(Optional::stream) can merge these.

### equals

```java
public boolean equals(Object obj)
```

Compare Optional values, including the empty state. Optional[Ada] equals Optional[Ada] -> true; two empties -> true; present vs empty -> false. Do not use ==.

### hashCode

```java
public int hashCode()
```

Return the contained value hash, or zero when empty. empty -> 0; Optional[Integer 0] -> 0 too. Equal hashes can collide; they do not identify absence.

### toString

```java
public String toString()
```

Return a nonempty debugging description. Typical JDK21 output: Optional[Ada] or Optional.empty. Exact format is unspecified; not a serialization format.

Worked later: case09 and value-comparison checks: Optional is a value-based class: compare with equals and avoid identity-sensitive operations such as synchronization on its instances. Ordinary inherited Object methods are outside this Optional-specific API map.

## Choosing the next step

| Intent | Operation | Worked lesson |
|---|---|---|
| Create explicit presence/absence | of, ofNullable, empty | [case01](lessons/01-creation/README.md) |
| Run an action for a lookup result | ifPresent, ifPresentOrElse | [case02](lessons/02-lookup/README.md) |
| Transform a present value | map | [case03](lessons/03-mapping/README.md) |
| Retain only an eligible value | filter | [case04](lessons/04-filtering/README.md) |
| Compose Optional-producing lookups | flatMap | [case05](lessons/05-flatmapping/README.md) |
| Choose eager/lazy fallback values | orElse, orElseGet | [case06](lessons/06-fallback/README.md) |
| Fail explicitly when a value is required | orElseThrow | [case07](lessons/07-required/README.md) |
| Try another Optional source | or | [case08](lessons/08-alternatives/README.md) |
| Merge present values into a pipeline | stream | [case09](lessons/09-streams/README.md) |
| Represent missing primitive maxima | OptionalInt, a different class | [case10](lessons/10-primitive/README.md) |

Live class: cases01/03/06. Other worked lessons are guided follow-up; API-map
pages do not introduce additional implementation tasks. State queries and value
methods can be examined alongside those examples. OptionalInt has its own API;
the20 declarations above belong to Optional<T>.

Primary reference, checked2026-10-28:
[Java21 Optional API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html).
All20 declarations were compared with the published Java21 member signatures.
Debug-format examples describe typical JDK21 output; the API does not promise
their exact text as a stable serialization format.
