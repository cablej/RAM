import * as identity from './identity.model';
import * as party from './party.model';
import * as profile from './profile.model';
import * as relationship from './relationship.model';
import * as relationshipAttributeName from './relationshipAttributeName.model';
import * as relationshipType from './relationshipType.model';
import * as role from './role.model';
import * as roleAttributeName from './roleAttributeName.model';
import * as roleType from './roleType.model';
import {ILink, Link} from '../../../commons/dtos/link.dto';

export class Links {

    private array: ILink[] = [];

    public push(type: string, method: string, href: string, condition: boolean = true): Links {
        if (condition) {
            this.array.push(new Link(type, method, href));
        }
        return this;
    }

    public pushLink(link: ILink, condition: boolean = true): Links {
        if (condition) {
            this.array.push(link);
        }
        return this;
    }

    public toArray(): ILink[] {
        return this.array;
    }

}

export class Url {

    // misc

    public static DELETE = 'DELETE';
    public static GET = 'GET';
    public static PATCH = 'PATCH';
    public static POST = 'POST';
    public static PUT = 'PUT';

    public static links(): Links {
        return new Links();
    }

    public static pathElements(url: string): string[] {
        return url ? url.split('/').map((value) => decodeURIComponent(value)) : [];
    }

    public static lastPathElement(url: string): string {
        const pathElements = Url.pathElements(url);
        return pathElements && pathElements.length > 0 ? pathElements[pathElements.length - 1] : null;
    }

    // identity .......................................................................................................

    public static abnIdValue(abn: string): string {
        return `PUBLIC_IDENTIFIER:ABN:${abn}`;
    }

    public static async forIdentity(model: identity.IIdentity): Promise<string> {
        return '/api/v1/identity/' + encodeURIComponent(model.idValue);
    }

    public static async forIdentityRelationshipList(model: identity.IIdentity): Promise<string> {
        return '/api/v1/relationships/identity/' + encodeURIComponent(model ? model.idValue : 'undefined');
    }

    public static async forIdentityRelationshipCreate(model: identity.IIdentity): Promise<string> {
        return '/api/v1/relationship';
    }

    public static async forIdentityRoleList(model: identity.IIdentity): Promise<string> {
        return '/api/v1/roles/identity/' + encodeURIComponent(model.idValue);
    }

    public static async forIdentityRoleCreate(model: identity.IIdentity): Promise<string> {
        return '/api/v1/role';
    }

    public static async forIdentityAUSkeyList(model: identity.IIdentity): Promise<string> {
        return '/api/v1/auskeys/identity/' + encodeURIComponent(model.idValue);
    }

    // party ..........................................................................................................

    public static async forPartyType(model: party.PartyType): Promise<string> {
        return '/api/v1/partyType/' + encodeURIComponent(model.code);
    }

    public static async forParty(model: party.IParty): Promise<string> {
        const defaultIdentity = await identity.IdentityModel.findDefaultByPartyId(model._id);
        if (defaultIdentity) {
            return '/api/v1/party/identity/' + encodeURIComponent(defaultIdentity.idValue);
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

    public static async forRelationshipClaim(invitationCode: string): Promise<string> {
        return '/api/v1/relationship/invitationCode/' + encodeURIComponent(invitationCode) + '/claim';
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

    public static async forRelationshipPrintInvitation(invitationCode: string): Promise<string> {
        return '/api/v1/relationship/invitationCode/' + encodeURIComponent(invitationCode) + '/print';
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

    // misc ...........................................................................................................

    public static collection() {

    }

}