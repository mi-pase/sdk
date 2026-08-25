import type { HttpClient } from "../../http";
import type { Project, UpdateProjectInput } from "../types";
import { EnrollmentResource } from "./enrollment.resource";
import { ProjectEnrollmentsResource } from "./project-enrollments.resource";
import { RewardsResource } from "./reward.resource";

export class ProjectResource {
	readonly rewards: RewardsResource;
	readonly enrollments: ProjectEnrollmentsResource;

	constructor(
		private readonly http: HttpClient,
		readonly id: string,
	) {
		this.rewards = new RewardsResource(http, id);
		this.enrollments = new ProjectEnrollmentsResource(http, id);
	}

	/** GET /api/projects/:id */
	get(): Promise<Project> {
		return this.http.get<Project>(`/api/projects/${this.id}`);
	}

	/** PUT /api/projects/:id */
	update(input: UpdateProjectInput): Promise<Project> {
		return this.http.put<Project>(`/api/projects/${this.id}`, input);
	}

	/** DELETE /api/projects/:id — only finalized projects can be deleted. */
	delete(): Promise<Project> {
		return this.http.delete<Project>(`/api/projects/${this.id}`);
	}

	/** POST /api/projects/:id/duplicate */
	duplicate(): Promise<Project> {
		return this.http.post<Project>(`/api/projects/${this.id}/duplicate`);
	}

	/**
	 * Address an enrollment in this project's context.
	 * @example client.project(projectId).enrollment(enrollmentId).setCustomFields({ seat: "12A" })
	 */
	enrollment(enrollmentId: string): EnrollmentResource {
		return new EnrollmentResource(this.http, enrollmentId);
	}
}
