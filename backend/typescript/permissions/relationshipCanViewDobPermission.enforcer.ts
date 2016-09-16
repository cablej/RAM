import {PermissionEnforcer} from '../models/base';
import {IPermission, Permission} from '../../../commons/dtos/permission.dto';
import {
    RelationshipCanViewDobPermission
} from '../../../commons/permissions/relationshipPermission.templates';
import {IRelationship, RelationshipStatus} from '../models/relationship.model';
import {Translator} from '../ram/translator';

export class RelationshipCanViewDobPermissionEnforcer extends PermissionEnforcer<IRelationship> {

    constructor() {
        super(RelationshipCanViewDobPermission);
    }

    public async evaluate(relationship: IRelationship): Promise<IPermission> {

        let permission = new Permission(this.template.code, this.template.description, this.template.value, this.template.linkType);
        let relationshipStatus = relationship.statusEnum();

        // validate pending
        if (relationshipStatus !== RelationshipStatus.Pending) {
            permission.messages.push(Translator.get('relationship.canViewDob.invalidStatus'));
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