/** Mongo ObjectId, serialized as a string over the wire. */
export type ObjectId = string;

export interface Timestamps {
	createdAt: string;
	updatedAt: string;
}
