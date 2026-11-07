# Real Estate Analytics

A reporting frontend for an operator monitoring scraped real-estate listings in Tirana: how prices move, which neighborhoods are covered, and how the EUR/USD rate shifts.

## Language

**Property Listing**:
A single advertised real-estate offer scraped from a source, with its price, size, and resolved Area.
_Avoid_: Property, listing, ad, post

**Euro Price**:
A Property Listing's price in euros, calculated by the backend from the price the source showed. It is the only price the Operator sees and the one every per-m² figure and price change uses. A Property Listing the backend could not price in euros (unsupported or missing currency) falls back to the price as the source showed it.
_Avoid_: Converted price, price in EUR

**Area**:
A named neighborhood or zone (e.g. "Blloku") that every Property Listing is resolved to.
_Avoid_: Neighborhood, zone, district, location

**Operator**:
The person who uses this frontend to monitor listings and audit the Area roster.
_Avoid_: User, admin

**Search**:
A free-text box above the Property Listing table. The Operator types words, and only Property Listings whose title or description contains every word are shown, ignoring case and accents. It is not remembered between visits.
_Avoid_: Query, keyword filter, find

**Search Type**:
A selector inside the Search box that sets how its text is read: `Text` (the default, the Search above), `ID`, or `Provider ID`. `ID` and `Provider ID` are exact: the whole box must equal a Capture's id or the listing's provider id. An `ID` search also finds a listing through an older Capture. It exists so the Operator can find a listing to update when its title and description are no help. Like Search, it combines with every other filter. It is not remembered between visits.
_Avoid_: Query, lookup, search mode
