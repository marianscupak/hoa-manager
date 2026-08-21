import { Role } from "@/auth/roles";

export function isAdminOrBoard(roles: Role[] | undefined): boolean {
	return !!roles?.some((r) => r === Role.ADMIN || r === Role.BOARD_MEMBER);
}

export function isAdminView(roles: Role[] | undefined): boolean {
	return !!roles?.some(
		(r) =>
			r === Role.ADMIN || r === Role.BOARD_MEMBER || r === Role.AUDITOR,
	);
}
