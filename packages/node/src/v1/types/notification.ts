import type { ObjectId, Timestamps } from "./common";

export type NotificationStatus = "sent" | "failed";

export interface Notification extends Timestamps {
	_id: ObjectId;
	domain: string;
	/**
	 * The project this notification targeted. Returned as a bare id by `send`,
	 * and populated to `{ _id, name }` by `list` / `listByPasses`.
	 */
	project: ObjectId | { _id: ObjectId; name: string };
	/** Shared text, used for both wallets unless a per-platform override is set. */
	message: string;
	/** Override that was used for Apple Wallet, if any. */
	appleMessage?: string;
	/** Override that was used for Google Wallet, if any (may contain an `<a href>` link). */
	googleMessage?: string;
	/** Lower bound of the issued-date window this send was filtered by (`YYYY-MM-DD`), if any. */
	issuedFrom?: string;
	/** Upper bound of the issued-date window this send was filtered by (`YYYY-MM-DD`, inclusive), if any. */
	issuedTo?: string;
	/** Specific enrollments this send was restricted to, if any. */
	enrollmentIds?: ObjectId[];
	status: NotificationStatus;
	/** How many active passes matched the filters at send time. */
	targetCount: number;
	/** How many of those passes the wallet push actually reached. */
	successCount: number;
	passIds: ObjectId[];
	deletedAt?: string;
}

export interface SendNotificationInput {
	domain: string;
	/** Project whose active passes will be notified. */
	project: string;
	/**
	 * Shared notification text, used for both platforms unless overridden by
	 * `appleMessage` / `googleMessage`. Max 500 characters.
	 */
	message: string;
	/**
	 * Overrides `message` for Apple Wallet only. Plain text — Apple's wallet
	 * push has no link support. Max 500 characters.
	 */
	appleMessage?: string;
	/**
	 * Overrides `message` for Google Wallet only. May contain a single
	 * `<a href="...">` anchor, which the Google Wallet app renders as a tappable
	 * link (Apple has no equivalent). Max 500 characters.
	 */
	googleMessage?: string;
	/**
	 * Restrict the send to the passes of these specific enrollments within the
	 * project (max 5000). IDs that don't belong to the project+domain simply
	 * match no pass. Intended for targeted, programmatic sends.
	 */
	enrollmentIds?: string[];
	/**
	 * Only notify passes issued on or after this calendar date (`YYYY-MM-DD`),
	 * interpreted in the project/domain timezone.
	 */
	issuedFrom?: string;
	/**
	 * Only notify passes issued on or before this calendar date (`YYYY-MM-DD`,
	 * inclusive), interpreted in the project/domain timezone.
	 */
	issuedTo?: string;
}

export interface ListNotificationsParams {
	domain: string;
}

export interface PreviewNotificationParams {
	domain: string;
	project: string;
	/** Restrict the count to these specific enrollments' passes. */
	enrollmentIds?: string[];
	/** Lower bound of the issued-date window (`YYYY-MM-DD`). */
	issuedFrom?: string;
	/** Upper bound of the issued-date window (`YYYY-MM-DD`, inclusive). */
	issuedTo?: string;
}

export interface NotificationPreview {
	/** How many active passes a send with these filters would target right now. */
	count: number;
	/**
	 * ISO timestamp until which this project is in its 24h send cooldown, or
	 * `null` if a notification may be sent now.
	 */
	cooldownUntil: string | null;
}
