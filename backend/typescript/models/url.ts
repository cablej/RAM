import * as identity from './identity.model';
import * as party from './party.model';
import * as profile from './profile.model';
import * as relationship from './relationship.model';
import * as relationshipAttributeName from './relationshipAttributeName.model';
import * as relationshipType from './relationshipType.model';
import * as role from './role.model';
import * as roleAttributeName from './roleAttributeName.model';
import * as roleType from './roleType.model';

export class Url {

    // identity .......................................................................................................

    public static async forIdentity(model: identity.IIdentity): Promise<string> {
        return '/api/v1/identity/' + encodeURIComponent(model.idValue);
    }

    // party ..........................................................................................................

    public static async forPartyType(model: party.PartyType): Promise<string> {
        return '/api/v1/partyType/' + encodeURIComponent(model.code);
    }

    public static async forParty(model: party.IParty): Promise<string> {
        const defaultIdentity = await identity.IdentityModel.findDefaultByPartyId(model.id);
        if (defaultIdentity) {
            return '/api/v1/party/identity/' + encodeURIComponent(encodeURIComponent(defaultIdentity.idValue));
        } else {
            throw new Error('Default Identity not found');
        }
    }

    // profile ........................................................................................................

    public static async forProfileProvider(model: profile.ProfileProvider): Promise<string> {
        return '/api/v1/profileProvider/' + encodeURIComponent(model.code);
    }

    // relationship ...................................................................................................

    public static async forRelationshipStatus(model: relationship.RelationshipStatus): Promise<string> {
        return '/api/v1/relationshipStatus/' + encodeURIComponent(model.code);
    }

    public static async forRelationship(model: relationship.IRelationship): Promise<string> {
        return '/api/v1/relationship/' + encodeURIComponent(model._id.toString());
    }

    public static async forRelationshipAccept(invitationCode: string): Promise<string> {
        return '/api/v1/relationship/invitationCode/' + encodeURIComponent(invitationCode) + '/accept';
    }

    public static async forRelationshipReject(invitationCode: string): Promise<string> {
        return '/api/v1/relationship/invitationCode/' + encodeURIComponent(invitationCode) + '/reject';
    }

    public static async forRelationshipNotifyDelegate(invitationCode: string): Promise<string> {
        return '/api/v1/relationship/invitationCode/' + encodeURIComponent(invitationCode) + '/notifyDelegate';
    }

    // relationship attribute name ....................................................................................

    public static async forRelationshipAttributeName(model: relationshipAttributeName.IRelationshipAttributeName): Promise<string> {
        return '/api/v1/relationshipAttributeName/' + encodeURIComponent(model.code);
    }

    // relationship type ..............................................................................................

    public static async forRelationshipType(model: relationshipType.IRelationshipType): Promise<string> {
        return '/api/v1/relationshipType/' + encodeURIComponent(model.code);
    }

    // role ...........................................................................................................

    public static async forRoleStatus(model: role.RoleStatus): Promise<string> {
        return '/api/v1/roleStatus/' + encodeURIComponent(model.code);
    }

    public static async forRole(model: role.IRole): Promise<string> {
        return '/api/v1/role/' + encodeURIComponent(model._id.toString());
    }

    // role attribute name ............................................................................................

    public static async forRoleAttributeName(model: roleAttributeName.IRoleAttributeName): Promise<string> {
        return '/api/v1/roleAttributeName/' + encodeURIComponent(model.code);
    }

    // role type ......................................................................................................

    public static async forRoleType(model: roleType.IRoleType): Promise<string> {
        return '/api/v1/roleType/' + encodeURIComponent(model.code);
    }

}