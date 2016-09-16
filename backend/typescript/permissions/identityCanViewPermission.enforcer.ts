import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {IdentityCanViewPermission} from '../../../commons/permissions/identityPermission.templates';
import {IIdentity} from '../models/identity.model';
import {context} from '../providers/context.provider';
import {Translator} from '../ram/translator';

export class IdentityCanViewPermissionEnforcer extends PermissionEnforcer<IIdentity> {

    constructor() {
        super(IdentityCanViewPermission);
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
            permission.link = new Link(permission.linkType, Url.GET, await Url.forIdentity(identity));
        } else {
            permission.value = false;
        }

        return permission;

    }

}