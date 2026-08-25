import type { ObjectId, Timestamps } from "./common";

export interface Reward extends Timestamps {
	_id: ObjectId;
	domain: string;
	project: ObjectId;
	name: string;
	description?: string;
	/** Private S3 key for the reward image (not a public URL). */
	image?: string;
	pointsRequired: number;
	deletedAt?: string;
}

export interface CreateRewardInput {
	name: string;
	description?: string;
	image?: string;
	pointsRequired: number;
}

export type UpdateRewardInput = Partial<CreateRewardInput>;
