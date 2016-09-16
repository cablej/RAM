import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {RelationshipCanAcceptPermission} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship, RelationshipStatus} from '../models/relationship.model';
import {context} from '../providers/context.provider';
import {Translator} from '../ram/translator';

export class RelationshipCanAcceptPermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanAcceptPermission);
    }

    public async evaluate(relationship: IRelationship): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);
        const acceptingDelegateIdentity = context.getAuthenticatedPrincipal().identity;

        // validate authenticated
        if (!context.getAuthenticatedPrincipalIdValue()) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // validate relationship status
        if (relationship.statusEnum() !== RelationshipStatus.Pending) {
            permission.messages.push(Translator.get('relationship.accept.notPending'));
        }

        // validate invitation
        if (!relationship.invitationIdentity) {
            permission.messages.push(Translator.get('relationship.accept.notInvitation'));
        }

        // validate delegate
        // todo handle B2B2I scenario
        if (acceptingDelegateIdentity) {
            if (acceptingDelegateIdentity.party.id !== relationship.delegate.id) {
                permission.messages.push(Translator.get('relationship.accept.notDelegate'));

            }
        }

        // validate identity strength
        if (acceptingDelegateIdentity) {
            if (acceptingDelegateIdentity.strength < relationship.relationshipType.minIdentityStrength) {
                permission.messages.push(Translator.get('relationship.accept.insufficientStrength'));
            }
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.POST, await Url.forRelationshipAccept(relationship.invitationIdentity.rawIdValue));
        } else {
            permission.value = false;
        }

        return permission;

    }

}