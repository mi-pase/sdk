import type { HttpClient } from "../../http";
import type {
	ListNotificationsParams,
	Notification,
	NotificationPreview,
	PreviewNotificationParams,
	SendNotificationInput,
} from "../types";

/**
 * Wallet push notifications. The API doesn't nest these under a project in its
 * URL (`project` is a field in the body/query), so this is a top-level
 * resource rather than a property of `ProjectResource`.
 *
 * The API enforces one notification per project per 24h; a send inside that
 * window fails with a 429 `MiPaseApiError`. Use `preview` first to get the
 * target count and cooldown window without consuming the cooldown.
 */
export class NotificationsResource {
	constructor(private readonly http: HttpClient) {}

	/** POST /api/notifications */
	send(input: SendNotificationInput): Promise<Notification> {
		return this.http.post<Notification>("/api/notifications", input);
	}

	/** GET /api/notifications?domain=... */
	list(params: ListNotificationsParams): Promise<Notification[]> {
		return this.http.get<Notification[]>("/api/notifications", {
			query: { ...params },
		});
	}

	/** GET /api/notifications?passes=id1,id2 */
	listByPasses(passIds: string[]): Promise<Notification[]> {
		// The API routes to its domain-scoped branch when `passes` is empty, so
		// short-circuit here to preserve the "notifications for these passes"
		// intent (and match the API's own empty-input behavior).
		if (passIds.length === 0) return Promise.resolve([]);
		return this.http.get<Notification[]>("/api/notifications", {
			query: { passes: passIds.join(",") },
		});
	}

	/** GET /api/notifications/preview?domain=...&project=...&enrollments=id1,id2&issuedFrom=...&issuedTo=... */
	preview(params: PreviewNotificationParams): Promise<NotificationPreview> {
		const { enrollmentIds, ...rest } = params;
		return this.http.get<NotificationPreview>("/api/notifications/preview", {
			query: {
				...rest,
				enrollments: enrollmentIds?.length
					? enrollmentIds.join(",")
					: undefined,
			},
		});
	}
}
