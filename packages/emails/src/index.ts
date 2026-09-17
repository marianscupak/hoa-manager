import { renderTemplate } from "./render";
import AccountExistsEmail, {
    type AccountExistsEmailProps,
    accountExistsSubject,
} from "./templates/account-exists";
import OwnerInviteEmail, {
    type OwnerInviteEmailProps,
    ownerInviteSubject,
} from "./templates/owner-invite";
import VerificationCodeEmail, {
    type VerificationCodeEmailProps,
    verificationCodeSubject,
} from "./templates/verification-code";
import type { RenderedEmail } from "./types";

export type { RenderedEmail } from "./types";
export type {
    OwnerInviteEmailProps,
    VerificationCodeEmailProps,
    AccountExistsEmailProps,
};

export function renderOwnerInviteEmail(
    props: OwnerInviteEmailProps,
): Promise<RenderedEmail> {
    return renderTemplate(
        { subject: ownerInviteSubject, Component: OwnerInviteEmail },
        props,
    );
}

export function renderVerificationCodeEmail(
    props: VerificationCodeEmailProps,
): Promise<RenderedEmail> {
    return renderTemplate(
        { subject: verificationCodeSubject, Component: VerificationCodeEmail },
        props,
    );
}

export function renderAccountExistsEmail(
    props: AccountExistsEmailProps,
): Promise<RenderedEmail> {
    return renderTemplate(
        { subject: accountExistsSubject, Component: AccountExistsEmail },
        props,
    );
}
