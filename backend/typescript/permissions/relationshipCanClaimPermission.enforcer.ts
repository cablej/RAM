import {PermissionEnforcer, Assert} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {RelationshipCanClaimPermission} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship, RelationshipStatus} from '../models/relationship.model';
import {Translator} from '../ram/translator';
import {context} from '../providers/context.provider';
import {IdentityType, IdentityInvitationCodeStatus, IdentityModel} from '../models/identity.model';

export class RelationshipCanClaimPermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanClaimPermission);
    }

    // todo this needs to check party access
    public async evaluate(relationship: IRelationship): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);
        let authenticatedIdentity = context.getAuthenticatedPrincipal().identity;
        let invitationIdentity = relationship.invitationIdentity;

        // validate authenticated
        if (!authenticatedIdentity) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // validate status
        if (relationship.statusEnum() !== RelationshipStatus.Pending) {
            permission.messages.push(Translator.get('relationship.claim.notPending'));
        }

        // validate invitation
        if (!invitationIdentity) {
            permission.messages.push(Translator.get('relationship.claim.notInvitation'));
        } else if (invitationIdentity.identityTypeEnum() !== IdentityType.InvitationCode) {
            permission.messages.push(Translator.get('relationship.claim.notInvitation'));
        }

        // validate invitation status
        if (invitationIdentity) {
            if (invitationIdentity.invitationCodeStatusEnum() !== IdentityInvitationCodeStatus.Pending &&
                invitationIdentity.invitationCodeStatusEnum() !== IdentityInvitationCodeStatus.Claimed) {
                permission.messages.push(Translator.get('relationship.claim.invalidInvitationStatus'));
            }
        }

        // validate invitation expiry
        if (invitationIdentity) {
            if (invitationIdentity.invitationCodeExpiryTimestamp.getTime() < new Date().getTime()) {
                permission.messages.push(Translator.get('relationship.claim.expiredInvitation'));
            }
        }

        // validate identity match
        // todo shared secret (dob) is not current checked
        if (invitationIdentity) {
            if (!authenticatedIdentity) {
                // agency user
                permission.messages.push(Translator.get('relationship.claim.agencyUserNotAllowed'));
            } else {
                // identity user
                if (!Assert.checkCaseInsensitiveEqual(authenticatedIdentity.profile.name.givenName, invitationIdentity.profile.name.givenName) ||
                    !Assert.checkCaseInsensitiveEqual(authenticatedIdentity.profile.name.familyName, invitationIdentity.profile.name.familyName)) {
                    permission.messages.push(Translator.get('relationship.claim.mismatchedName'));
                }
            }
        }

        // validate abn
        const abn = context.getAuthenticatedABN();
        if (abn) {
            const allSubjectIdentities = await IdentityModel.listByPartyId(relationship.subject.id);
            let found: boolean = false;
            for (let subjectIdentity of allSubjectIdentities) {
                if (subjectIdentity.rawIdValue === abn) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                permission.messages.push(Translator.get('relationship.claim.mismatchedABN'));
            }
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.POST, await Url.forRelationshipClaim(invitationIdentity.rawIdValue));
        } else {
            permission.value = false;
        }

        return permission;

    }

}