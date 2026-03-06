/**
 * Shared Firestore types
 */

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };
