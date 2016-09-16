import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {IdentityCanListRolesPermission} from '../../../commons/permissions/identityPermission.templates';
import {IIdentity} from '../models/identity.model';
import {Translator} from '../ram/translator';
import {context} from '../providers/context.provider';

export class IdentityCanListRolesPermissionEnforcer extends PermissionEnforcer<IIdentity> {

    constructor() {
        super(IdentityCanListRolesPermission);
    }

    // todo this needs to check party access
    public async evaluate(identity: IIdentity): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);

        // validate authenticated
        if (!context.getAuthenticatedPrincipalIdValue()) {
            permission.messages.push(Translator.get('security.notAuthenticated'));
        }

        // set value and link
        if (permission.messages.length === 0) {
            permission.value = true;
            permission.link = new Link(permission.linkType, Url.GET, await Url.forIdentityRoleList(identity));
        } else {
            permission.value = false;
        }

        return permission;

    }

}