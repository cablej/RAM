import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {Url} from '../models/url';
import {Link} from '../../../commons/dtos/link.dto';
import {RelationshipCanViewPermission} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship} from '../models/relationship.model';

export class RelationshipCanViewPermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanViewPermission);
    }

    // todo this needs to check party access
    public async evaluate(relationship: IRelationship): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);

        permission.value = true;
        permission.link = new Link(permission.linkType, Url.GET, await Url.forRelationship(relationship));

        return permission;

    }

}