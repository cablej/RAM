import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {RelationshipCanModifyPermission} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship, RelationshipStatus} from '../models/relationship.model';
import {context} from '../providers/context.provider';
import {Translator} from '../ram/translator';
import {RelationshipTypeModel} from '../models/relationshipType.model';
import {Constants} from '../../../commons/constants';
import {PartyModel} from '../models/party.model';

// todo a whole bunch of rules are in https://relationshipaccessmanager.atlassian.net/browse/RAMREQ-115
export class RelationshipCanModifyPermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanModifyPermission);
    }

    // todo this needs to check party access
    public async evaluate(relationship: IRelationship): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);
        let authenticatedPrincipal = context.getAuthenticatedPrincipal();
        let authenticatedIdentity = authenticatedPrincipal ? authenticatedPrincipal.identity : null;
        let authenticatedParty = authenticatedIdentity ? authenticatedIdentity.party : null;
        let relationshipType = await RelationshipTypeModel.findByCodeIgnoringDateRange(relationship.relationshipType.code);
        let relationshipStatus = relationship.statusEnum();
        let delegateParty = relationship.delegate;
        let delegateCanEditOwnAttributeUsage = relationshipType.findAttributeNameUsage(Constants.RelationshipAttributeNameCode.DELEGATE_EDIT_OWN_IND);
        let subjectDefaultIdentity = await relationship.subject.findDefaultIdentity();
        let myStrongestStrength = await PartyModel.computeConnectionStrength(subjectDefaultIdentity.idValue, authenticatedPrincipal);

        // validate authenticated
        if (!authenticatedPrincipal) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // validate relationship type
        let manageExternallyIndAttributeUsage = relationshipType.findAttributeNameUsage(Constants.RelationshipAttributeNameCode.MANAGED_EXTERNALLY_IND);
        if (manageExternallyIndAttributeUsage) {
            permission.messages.push(Translator.get('relationship.modify.managedExternally'));
        }

        // validate status
        if (relationshipStatus !== RelationshipStatus.Pending && relationshipStatus !== RelationshipStatus.Accepted) {
            permission.messages.push(Translator.get('relationship.modify.invalidStatus'));
        }

        // validate strength
        if (myStrongestStrength < relationship.strength) {
            permission.messages.push(Translator.get('relationship.modify.insufficientStrength'));
        }

        // validate cannot edit own
        if (authenticatedParty) {
            if (!delegateCanEditOwnAttributeUsage) {
                if (authenticatedParty.id === delegateParty.id) {
                    if (Math.floor(myStrongestStrength) <= relationship.strength) {
                        permission.messages.push(Translator.get('relationship.modify.sameDelegate'));
                    }
                }
            }
        }

        // validate can edit own or someone else's
        if (authenticatedParty) {
            if (delegateCanEditOwnAttributeUsage || authenticatedParty.id !== delegateParty.id) {
                if (Math.floor(myStrongestStrength) === myStrongestStrength) {
                    permission.messages.push(Translator.get('relationship.modify.notAuthAdmin'));
                }
            }
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.PUT, await Url.forRelationship(relationship));
        } else {
            permission.value = false;
        }

        return permission;

    }

}