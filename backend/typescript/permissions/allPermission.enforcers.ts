import {IIdentity} from '../models/identity.model';
import {IName} from '../models/name.model';
import {IParty} from '../models/party.model';
import {IProfile} from '../models/profile.model';
import {IRole} from '../models/role.model';
import {IRelationship} from '../models/relationship.model';
import {ISharedSecret} from '../models/sharedSecret.model';
import {IRoleAttribute} from '../models/roleAttribute.model';
import {IRoleAttributeNameUsage} from '../models/roleAttributeNameUsage.model';
import {IPermissionEnforcer} from '../models/base';
import {RelationshipCanAcceptPermissionEnforcer} from './relationshipCanAcceptPermission.enforcer';
import {RelationshipCanClaimPermissionEnforcer} from './relationshipCanClaimPermission.enforcer';
import {RelationshipCanModifyPermissionEnforcer} from './relationshipCanModifyPermission.enforcer';
import {RelationshipCanNotifyDelegatePermissionEnforcer} from './relationshipCanNotifyDelegatePermission.enforcer';
import {RelationshipCanPrintInvitationPermissionEnforcer} from './relationshipCanPrintInvitationPermission.enforcer';
import {RelationshipCanRejectPermissionEnforcer} from './relationshipCanRejectPermission.enforcer';
import {RelationshipCanViewPermissionEnforcer} from './relationshipCanViewPermission.enforcer';
import {IRelationshipAttributeNameUsage} from '../models/relationshipAttributeNameUsage.model';
import {IRelationshipAttribute} from '../models/relationshipAttribute.model';
import {IdentityCanListRelationshipsPermissionEnforcer} from './identityCanListRelationshipsPermission.enforcer';
import {IdentityCanViewPermissionEnforcer} from './identityCanViewPermission.enforcer';
import {IdentityCanCreateRelationshipPermissionEnforcer} from './identityCanCreateRelationshipPermission.enforcer';
import {IdentityCanCreateRolePermissionEnforcer} from './identityCanCreateRolePermission.enforcer';
import {IdentityCanListAuskeysPermissionEnforcer} from './identityCanListAuskeysPermission.enforcer';
import {IdentityCanListRolesPermissionEnforcer} from './identityCanListRolesPermission.enforcer';
import {RelationshipCanViewDobPermissionEnforcer} from './relationshipCanViewDobPermission.enforcer';
import {RelationshipCanEditDelegatePermissionEnforcer} from './relationshipCanEditDelegatePermission.enforcer';

export class PermissionEnforcers {

    public static identity: IPermissionEnforcer<IIdentity>[] = [
        new IdentityCanCreateRelationshipPermissionEnforcer(),
        new IdentityCanCreateRolePermissionEnforcer(),
        new IdentityCanListAuskeysPermissionEnforcer(),
        new IdentityCanListRelationshipsPermissionEnforcer(),
        new IdentityCanListRolesPermissionEnforcer(),
        new IdentityCanViewPermissionEnforcer(),
    ];

    public static iname: IPermissionEnforcer<IName>[] = [];

    public static party: IPermissionEnforcer<IParty>[] = [];

    public static profile: IPermissionEnforcer<IProfile>[] = [];

    public static relationship: IPermissionEnforcer<IRelationship>[] = [
        new RelationshipCanAcceptPermissionEnforcer(),
        new RelationshipCanClaimPermissionEnforcer(),
        new RelationshipCanModifyPermissionEnforcer(),
        new RelationshipCanNotifyDelegatePermissionEnforcer(),
        new RelationshipCanPrintInvitationPermissionEnforcer(),
        new RelationshipCanRejectPermissionEnforcer(),
        new RelationshipCanViewPermissionEnforcer(),
        new RelationshipCanEditDelegatePermissionEnforcer(),
        new RelationshipCanViewDobPermissionEnforcer(),
    ];

    public static relationshipAttribute: IPermissionEnforcer<IRelationshipAttribute>[] = [];

    public static relationshipAttributeNameUsage: IPermissionEnforcer<IRelationshipAttributeNameUsage>[] = [];

    public static role: IPermissionEnforcer<IRole>[] = [];

    public static sharedSecret: IPermissionEnforcer<ISharedSecret>[] = [];

    public static roleAttribute: IPermissionEnforcer<IRoleAttribute>[] = [];

    public static roleAttributeNameUsage: IPermissionEnforcer<IRoleAttributeNameUsage>[] = [];

}