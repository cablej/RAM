import {Permissions} from '../dtos/permission.dto';
import {Relationships} from './relationshipPermission.templates';
import {IdentityPermissions} from './identityPermission.templates';
import {NamePermissions} from './namePermission.templates';
import {PartyPermissions} from './partyPermission.templates';
import {ProfilePermissions} from './profilePermission.templates';
import {RolePermissions} from './rolePermission.templates';
import {SharedSecretPermissions} from './sharedSecretPermission.templates';
import {RelationshipAttributePermissions} from './relationshipAttributePermission.templates';
import {RelationshipAttributeNameUsagePermissions} from './relationshipAttributeNameUsagePermission.templates';
import {RoleAttributePermissions} from './roleAttributePermission.templates';
import {RoleAttributeNameUsagePermissions} from './roleAttributeNameUsagePermission.templates';

export class PermissionTemplates {

    public static identity: Permissions = IdentityPermissions;

    public static iname: Permissions = NamePermissions;

    public static party: Permissions = PartyPermissions;

    public static profile: Permissions = ProfilePermissions;

    public static relationship: Permissions = Relationships;

    public static relationshipAttribute: Permissions = RelationshipAttributePermissions;

    public static relationshipAttributeNameUsage: Permissions = RelationshipAttributeNameUsagePermissions;

    public static role: Permissions = RolePermissions;

    public static roleAttribute: Permissions = RoleAttributePermissions;

    public static roleAttributeNameUsage: Permissions = RoleAttributeNameUsagePermissions;

    public static sharedSecret: Permissions = SharedSecretPermissions;

}