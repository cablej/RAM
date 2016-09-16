import {Builder} from './builder.dto';
import {IProfile, Profile} from './profile.dto';
import {IHrefValue, HrefValue} from './hrefValue.dto';
import {IParty, Party} from './party.dto';
import {IResource, Resource} from './resource.dto';
import {Permissions} from './permission.dto';
import {PermissionTemplates} from '../permissions/allPermission.templates';

export interface IIdentity extends IResource {
    idValue: string;
    rawIdValue: string;
    identityType: string;
    defaultInd: boolean;
    strength: number;
    agencyScheme: string;
    agencyToken: string;
    invitationCodeStatus: string;
    invitationCodeExpiryTimestamp: Date;
    invitationCodeClaimedTimestamp: Date;
    invitationCodeTemporaryEmailAddress: string;
    publicIdentifierScheme: string;
    linkIdScheme: string;
    linkIdConsumer: string;
    profile: IProfile;
    party: IHrefValue<IParty>;
}

export class Identity extends Resource implements IIdentity {
    public static build(sourceObject: any): IIdentity {
        return new Builder<IIdentity>(sourceObject, this)
            .map('profile', Profile)
            .mapHref('party', Party)
            .build();
    }

    constructor(permissions: Permissions,
                public idValue: string,
                public rawIdValue: string,
                public identityType: string,
                public defaultInd: boolean,
                public strength: number,
                public agencyScheme: string,
                public agencyToken: string,
                public invitationCodeStatus: string,
                public invitationCodeExpiryTimestamp: Date,
                public invitationCodeClaimedTimestamp: Date,
                public invitationCodeTemporaryEmailAddress: string,
                public publicIdentifierScheme: string,
                public linkIdScheme: string,
                public linkIdConsumer: string,
                public profile: Profile,
                public party: HrefValue<Party>) {
        super(permissions ? permissions : PermissionTemplates.identity);
    }
}