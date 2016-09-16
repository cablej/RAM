import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {RelationshipCanNotifyDelegatePermission} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship, RelationshipStatus} from '../models/relationship.model';
import {context} from '../providers/context.provider';
import {Translator} from '../ram/translator';
import {IdentityType, IdentityInvitationCodeStatus} from '../models/identity.model';

export class RelationshipCanNotifyDelegatePermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanNotifyDelegatePermission);
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

        // validate invitation
        if (!invitationIdentity) {
            permission.messages.push(Translator.get('relationship.notifyDelegate.notInvitation'));
        } else if (invitationIdentity.identityTypeEnum() !== IdentityType.InvitationCode) {
            permission.messages.push(Translator.get('relationship.notifyDelegate.notInvitation'));
        }

        // validate relationship status
        if (relationship.statusEnum() !== RelationshipStatus.Pending) {
            permission.messages.push(Translator.get('relationship.accept.notPending'));
        }

        // validate invitation status
        if (invitationIdentity) {
            if (invitationIdentity.invitationCodeStatusEnum() !== IdentityInvitationCodeStatus.Pending) {
                permission.messages.push(Translator.get('relationship.notifyDelegate.invalidInvitationStatus'));
            }
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.POST, await Url.forRelationshipNotifyDelegate(relationship.invitationIdentity.rawIdValue));
        } else {
            permission.value = false;
        }

        return permission;

    }

}