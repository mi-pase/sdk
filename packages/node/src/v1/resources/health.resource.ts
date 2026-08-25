import type { HttpClient } from "../../http";
import type { HealthStatus } from "../types";

export class HealthResource {
	constructor(private readonly http: HttpClient) {}

	/** GET /api/health — no auth required, but the SDK sends it anyway. */
	get(): Promise<HealthStatus> {
		return this.http.get<HealthStatus>("/api/health");
	}
}
