import type { ObjectId, Timestamps } from "./common";
import type { Project } from "./project";

export type ScanMode = "camera" | "nfc" | "both";
export type ValidationMode = "validate" | "validate-no-repeat";

export interface Validator extends Timestamps {
	_id: ObjectId;
	domain: string;
	name: string;
	/** Always returned populated (full Project document), not a bare id. */
	project: Project;
	customFieldKey?: string;
	scanMode: ScanMode;
	validationMode: ValidationMode;
	deletedAt?: string;
}

export interface CreateValidatorInput {
	domain: string;
	name: string;
	/** Project ID whose enrollments will be checked. */
	project: string;
	scanMode?: ScanMode;
	validationMode?: ValidationMode;
}

export interface UpdateValidatorInput {
	name?: string;
	scanMode?: ScanMode;
	validationMode?: ValidationMode;
}

export interface ListValidatorsParams {
	domain: string;
}

export interface ScanPassInput {
	/** Raw value decoded from the QR code or NFC tag. */
	scannedValue: string;
	scanMode: "camera" | "nfc";
	/** Disambiguates when multiple passes share the same QR/NFC value. */
	enrollmentId?: string;
}

export type ValidationRecordStatus = "valid" | "invalid" | "already_used";

export interface ValidationRecord extends Timestamps {
	_id: ObjectId;
	domain: string;
	validator?: ObjectId;
	/** 'validator' = scan via a configured Validator; 'station' = the Station page. */
	source: "validator" | "station";
	project: ObjectId;
	scannedValue: string;
	status: ValidationRecordStatus;
	/** Populated when the scanned value resolves to a known enrollment. */
	enrollment?: ObjectId;
	scannedBy: string;
	scannedByEmail?: string;
	scanMode: "camera" | "nfc";
}

export interface ListValidationRecordsParams {
	limit?: number;
	skip?: number;
	search?: string;
}

export interface ValidationRecordsPage {
	data: ValidationRecord[];
	total: number;
}

export interface ScanMatchCandidate {
	enrollmentId: ObjectId;
	person: { name: string; email?: string } | null;
	passStatus: "valid" | "invalid";
}

/**
 * When a scanned value resolves to more than one enrollment and no
 * `enrollmentId` was given to disambiguate, the API returns candidates
 * instead of recording a result — re-scan with `enrollmentId` set.
 */
export interface ScanAmbiguousResult {
	matches: ScanMatchCandidate[];
}

export type ScanResult = ValidationRecord | ScanAmbiguousResult;

export function isScanAmbiguous(
	result: ScanResult,
): result is ScanAmbiguousResult {
	return "matches" in result;
}
