export interface CampusEvent {
  id: string;
  title: string;
  kind: "club" | "general" | "exam";
  /** ISO 8601 timestamp with a timezone. */
  startsAt: string;
  buildingId: string;
  destinationPlaceId: string;
  sourceUrl?: string;
}
