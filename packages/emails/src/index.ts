import { renderTemplate } from "./render";
import OwnerInviteEmail, {
    type OwnerInviteEmailProps,
    ownerInviteSubject,
} from "./templates/owner-invite";
import type { RenderedEmail } from "./types";

export type { RenderedEmail } from "./types";
export type { OwnerInviteEmailProps };

export function renderOwnerInviteEmail(
    props: OwnerInviteEmailProps,
): Promise<RenderedEmail> {
    return renderTemplate(
        { subject: ownerInviteSubject, Component: OwnerInviteEmail },
        props,
    );
}
