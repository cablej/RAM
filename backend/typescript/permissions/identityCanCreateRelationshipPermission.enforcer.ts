import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {IIdentity} from '../models/identity.model';
import {Translator} from '../ram/translator';
import {context} from '../providers/context.provider';
import {IdentityCanCreateRelationshipPermission} from '../../../commons/permissions/identityPermission.templates';
import {PartyType} from '../models/party.model';

export class IdentityCanCreateRelationshipPermissionEnforcer extends PermissionEnforcer<IIdentity> {

    constructor() {
        super(IdentityCanCreateRelationshipPermission);
    }

    // todo this needs to check party access
    public async evaluate(identity: IIdentity): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);

        // validate authenticated
        if (!context.getAuthenticatedPrincipalIdValue()) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // validate is business (B2I, B2B)
        if (identity.party.partyTypeEnum() !== PartyType.ABN) {
            permission.messages.push(Translator.get('identity.createRelationship.notABN'));
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.POST, await Url.forIdentityRelationshipCreate(identity));
        } else {
            permission.value = false;
        }

        return permission;

    }

}