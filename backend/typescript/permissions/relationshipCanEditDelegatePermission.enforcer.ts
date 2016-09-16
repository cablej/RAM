import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {RelationshipCanEditDelegatePermission} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship, RelationshipStatus} from '../models/relationship.model';
import {context} from '../providers/context.provider';
import {Translator} from '../ram/translator';
import {PartyModel} from '../models/party.model';
import {IdentityModel} from '../models/identity.model';

export class RelationshipCanEditDelegatePermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanEditDelegatePermission);
    }

    public async evaluate(relationship: IRelationship): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);
        let authenticatedPrincipal = context.getAuthenticatedPrincipal();
        let relationshipStatus = relationship.statusEnum();

        // validate authenticated
        if (!authenticatedPrincipal) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // validate has access
        let subjectDefaultIdentity = await IdentityModel.findDefaultByPartyId(relationship.subject.id);
        let hasAccess = PartyModel.hasAccess(subjectDefaultIdentity.idValue, context.getAuthenticatedPrincipal());
        if (!hasAccess) {
            permission.messages.push(Translator.get('security.noAccess'));
        }

        // validate pending
        if (relationshipStatus !== RelationshipStatus.Pending) {
            permission.messages.push(Translator.get('relationship.canEditDelegate.invalidStatus'));
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
        } else {
            permission.value = false;
        }

        return permission;

    }

}