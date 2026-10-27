# Real Estate Analytics

A reporting frontend for an operator monitoring scraped real-estate listings in Tirana: how prices move, which neighborhoods are covered, and how the EUR/USD rate shifts.

## Language

**Property Listing**:
A single advertised real-estate offer scraped from a source, with its price, size, and resolved Area.
_Avoid_: Property, listing, ad, post

**Area**:
A named neighborhood or zone (e.g. "Blloku") that every Property Listing is resolved to.
_Avoid_: Neighborhood, zone, district, location

**Operator**:
The person who uses this frontend to monitor listings and audit the Area roster.
_Avoid_: User, admin
