export type ListingMarkKind = "bookmarked" | "dismissed";

interface Markable {
  providerId: string;
  bookmarked: boolean;
  dismissed: boolean;
}

// A listing is never both bookmarked and dismissed: turning one on turns the other off.
export function applyListingMark<T extends Markable>(
  items: T[],
  providerId: string,
  mark: ListingMarkKind,
  on: boolean,
): T[] {
  return items.map((item) =>
    item.providerId === providerId
      ? {
          ...item,
          bookmarked: mark === "bookmarked" ? on : on ? false : item.bookmarked,
          dismissed: mark === "dismissed" ? on : on ? false : item.dismissed,
        }
      : item,
  );
}
