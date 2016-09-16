import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {IdentityCanListAuskeysPermission} from '../../../commons/permissions/identityPermission.templates';
import {IIdentity} from '../models/identity.model';
import {Translator} from '../ram/translator';
import {context} from '../providers/context.provider';

export class IdentityCanListAuskeysPermissionEnforcer extends PermissionEnforcer<IIdentity> {

    constructor() {
        super(IdentityCanListAuskeysPermission);
    }

    // todo this needs to check party access
    public async evaluate(identity: IIdentity): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);

        // validate authenticated
        if (!context.getAuthenticatedPrincipalIdValue()) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // validate ABN
        if (identity.publicIdentifierScheme !== 'ABN') {
            permission.messages.push(Translator.get('relationship.listAuskeys.notABN'));
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.GET, await Url.forIdentityAUSkeyList(identity));
        } else {
            permission.value = false;
        }

        return permission;

    }

}