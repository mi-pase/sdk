import type { HttpClient } from "../../http";
import type { CreateRewardInput, Reward, UpdateRewardInput } from "../types";

/** Rewards are always scoped to a project — there is no top-level `/rewards` endpoint. */
export class RewardsResource {
	constructor(
		private readonly http: HttpClient,
		private readonly projectId: string,
	) {}

	/** GET /api/projects/:projectId/rewards */
	list(): Promise<Reward[]> {
		return this.http.get<Reward[]>(
			`/api/projects/${this.projectId}/rewards`,
		);
	}

	/** POST /api/projects/:projectId/rewards */
	create(input: CreateRewardInput): Promise<Reward> {
		return this.http.post<Reward>(
			`/api/projects/${this.projectId}/rewards`,
			input,
		);
	}

	/** PUT /api/projects/:projectId/rewards/:id */
	update(rewardId: string, input: UpdateRewardInput): Promise<Reward> {
		return this.http.put<Reward>(
			`/api/projects/${this.projectId}/rewards/${rewardId}`,
			input,
		);
	}

	/** DELETE /api/projects/:projectId/rewards/:id */
	delete(rewardId: string): Promise<Reward> {
		return this.http.delete<Reward>(
			`/api/projects/${this.projectId}/rewards/${rewardId}`,
		);
	}
}
