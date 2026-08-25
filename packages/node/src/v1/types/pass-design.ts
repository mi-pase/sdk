/**
 * A single configurable field value in a pass design.
 * - static:      a fixed string written at design time.
 * - field:       resolved at issuance from `enrollment.customFields[fieldKey]`.
 * - conditional: `enrollment.customFields[fieldKey] <condOperator> condOperand ? condResult : condDefault`.
 * - array:       a full replacement array for a pass field section (Apple `applePassDesign` only).
 */
export interface PassFieldValue {
	type: "static" | "field" | "conditional" | "array";
	/** Fixed string value (type=static). */
	value?: string;
	/** Custom field key to resolve at issuance (type=field|conditional). */
	fieldKey?: string;
	condOperator?: "==" | "!=" | "contains";
	condOperand?: string;
	condResult?: string;
	condDefault?: string;
	/** type=array: structural items, each with an optional nested field value. */
	items?: Array<{ key: string; label: string; value?: PassFieldValue }>;
}

/** Per-person field overrides for a Google Wallet EventTicketObject. */
export interface GoogleEventPassDesign {
	/** barcode.type — QR_CODE, PDF_417, AZTEC, CODE_128, etc. */
	barcodeType?: string;
	barcodeValue?: PassFieldValue;
	smartTapRedemptionValue?: PassFieldValue;
	ticketNumber?: PassFieldValue;
	ticketType?: PassFieldValue;
	confirmationCode?: PassFieldValue;
	seatSection?: PassFieldValue;
	seatRow?: PassFieldValue;
	seatSeat?: PassFieldValue;
	seatGate?: PassFieldValue;
	hexBackgroundColor?: PassFieldValue;
	heroImageUri?: PassFieldValue;
}

export interface GoogleLoyaltyPassDesign {
	/** barcode.type — QR_CODE, PDF_417, AZTEC, CODE_128, DATA_MATRIX. */
	barcodeType?: string;
	barcodeValue?: PassFieldValue;
	smartTapRedemptionValue?: PassFieldValue;
	accountId?: PassFieldValue;
	accountName?: PassFieldValue;
	loyaltyPointsLabel?: PassFieldValue;
	loyaltyPointsBalance?: PassFieldValue;
	hexBackgroundColor?: PassFieldValue;
	heroImageUri?: PassFieldValue;
	/** ACTIVE | COMPLETED | EXPIRED | INACTIVE */
	state?: string;
}

export interface GoogleGenericPassDesign {
	/** barcode.type — QR_CODE, PDF_417, AZTEC, CODE_128, DATA_MATRIX. */
	barcodeType?: string;
	barcodeValue?: PassFieldValue;
	smartTapRedemptionValue?: PassFieldValue;
	cardTitle?: PassFieldValue;
	header?: PassFieldValue;
	subheader?: PassFieldValue;
	hexBackgroundColor?: PassFieldValue;
	logoUri?: PassFieldValue;
	heroImageUri?: PassFieldValue;
	/** ACTIVE | COMPLETED | EXPIRED | INACTIVE */
	state?: string;
	/** GENERIC_TYPE_UNSPECIFIED | GENERIC_SEASON_PASS | GENERIC_UTILITY_BILLS | GENERIC_PARKING_PASS | GENERIC_VOUCHER | GENERIC_GYM_MEMBERSHIP | GENERIC_LIBRARY_MEMBERSHIP | GENERIC_RESERVATIONS | GENERIC_AUTO_INSURANCE | GENERIC_HOME_INSURANCE | GENERIC_ENTRY_TICKET | GENERIC_RECEIPT | GENERIC_LOYALTY_CARD | GENERIC_OTHER */
	genericType?: string;
}
