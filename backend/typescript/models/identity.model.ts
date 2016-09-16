import * as mongoose from 'mongoose';
import * as mongooseAutoIncrement from 'mongoose-auto-increment';
import {conf} from '../bootstrap';
import * as Hashids from 'hashids';
import {RAMEnum, RAMSchema, Model, IRAMObject, RAMObject} from './base';
import {Url} from './url';
import {HrefValue, Identity as DTO, SearchResult, CreateIdentityDTO} from '../../../commons/api';
import {NameModel} from './name.model';
import {SharedSecretModel, ISharedSecret} from './sharedSecret.model';
import {IProfile, ProfileModel, ProfileProvider} from './profile.model';
import {IParty, PartyModel, PartyType} from './party.model';
import {SharedSecretTypeModel, DOB_SHARED_SECRET_TYPE_CODE} from './sharedSecretType.model';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// mongoose ...........................................................................................................

let IdentityMongooseModel: mongoose.Model<IIdentityDocument>;

// enums, utilities, helpers ..........................................................................................

const MAX_PAGE_SIZE = 100;
const NEW_INVITATION_CODE_EXPIRY_DAYS = 7;

/*
 * It is always possible that the name returned by the ABR is different to the
 * company name already recorded in RAM. Add an additional identity to overcome
 * this limitation.
 */
const addCompanyNameIfNeeded = async(identity: IIdentity, name: string): Promise<IIdentity> => {
    // TODO: implement if we want a total merge - not urgent
    return identity;
};

const saltedHashids = new Hashids(conf.hashIdsSalt, 6, 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789');

const getNewInvitationCodeExpiry = (): Date => {
    let date = new Date();
    date.setDate(date.getDate() + NEW_INVITATION_CODE_EXPIRY_DAYS);
    return date;
};

export class IdentityType extends RAMEnum {

    public static AgencyProvidedToken = new IdentityType('AGENCY_PROVIDED_TOKEN', 'Agency Provided Token')
        .withIdValueBuilder((identity: IIdentity): String => {
            return identity.identityType + ':' + identity.agencyScheme + ':' + identity.rawIdValue;
        });

    public static InvitationCode = new IdentityType('INVITATION_CODE', 'Invitation Code')
        .withIdValueBuilder((identity: IIdentity): String => {
            return identity.identityType + ':' + identity.rawIdValue;
        });

    public static LinkId = new IdentityType('LINK_ID', 'Link ID')
        .withIdValueBuilder((identity: IIdentity): String => {
            return identity.identityType + ':' + identity.linkIdScheme + ':' + identity.rawIdValue;
        });

    public static PublicIdentifier = new IdentityType('PUBLIC_IDENTIFIER', 'Public Identifier')
        .withIdValueBuilder((identity: IIdentity): String => {
            return identity.identityType + ':' + identity.publicIdentifierScheme + ':' + identity.rawIdValue;
        });

    protected static AllValues = [
        IdentityType.AgencyProvidedToken,
        IdentityType.InvitationCode,
        IdentityType.LinkId,
        IdentityType.PublicIdentifier
    ];

    public buildIdValue: (identity: IIdentity) => String;

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }

    public withIdValueBuilder(builder: (identity: IIdentity) => String): IdentityType {
        this.buildIdValue = builder;
        return this;
    }
}

export class IdentityInvitationCodeStatus extends RAMEnum {

    public static Claimed = new IdentityInvitationCodeStatus('CLAIMED', 'Claimed');
    public static Pending = new IdentityInvitationCodeStatus('PENDING', 'Pending');
    public static Rejected = new IdentityInvitationCodeStatus('REJECTED', 'Rejected');//TODO this state is not possible?

    protected static AllValues = [
        IdentityInvitationCodeStatus.Claimed,
        IdentityInvitationCodeStatus.Pending,
        IdentityInvitationCodeStatus.Rejected
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

export class IdentityAgencyScheme extends RAMEnum {

    public static Medicare = new IdentityAgencyScheme('MEDICARE', 'Medicare');

    protected static AllValues = [
        IdentityAgencyScheme.Medicare
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

export class IdentityPublicIdentifierScheme extends RAMEnum {

    public static ABN = new IdentityPublicIdentifierScheme('ABN', 'ABN');

    protected static AllValues = [
        IdentityPublicIdentifierScheme.ABN
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

export class IdentityLinkIdScheme extends RAMEnum {

    public static AUSkey = new IdentityPublicIdentifierScheme('AUSKEY', 'AUSkey');
    public static AuthenticatorApp = new IdentityPublicIdentifierScheme('AUTHENTICATOR_APP', 'Authenticator App');
    public static MyGov = new IdentityPublicIdentifierScheme('MY_GOV', 'myGov');

    protected static AllValues = [
        IdentityLinkIdScheme.AUSkey,
        IdentityLinkIdScheme.AuthenticatorApp,
        IdentityLinkIdScheme.MyGov
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

// schema .............................................................................................................

const IdentitySchema = RAMSchema({
    idValue: {
        type: String,
        required: [true, 'Id Value is required'],
        trim: true
    },
    rawIdValue: {
        type: String,
        required: [true, 'Raw Id Value is required'],
        trim: true
    },
    identityType: {
        type: String,
        required: [true, 'Identity Type is required'],
        trim: true,
        enum: IdentityType.valueStrings()
    },
    defaultInd: {
        type: Boolean,
        required: [true, 'Default Indicator is required'],
        default: false
    },
    strength: {
        type: Number,
        required: [true, 'Strength is required'],
        default: 0
    },
    agencyScheme: {
        type: String,
        trim: true,
        required: [function () {
            return this.identityType === IdentityType.AgencyProvidedToken.code;
        }, 'Agency Scheme is required'],
        enum: IdentityAgencyScheme.valueStrings()
    },
    agencyToken: {
        type: String,
        trim: true,
        required: [function () {
            return this.identityType === IdentityType.AgencyProvidedToken.code;
        }, 'Agency Token is required']
    },
    invitationCodeStatus: {
        type: String,
        trim: true,
        required: [function () {
            return this.identityType === IdentityType.InvitationCode.code;
        }, 'Invitation Code Status is required'],
        enum: IdentityInvitationCodeStatus.valueStrings()
    },
    invitationCodeExpiryTimestamp: {
        type: Date,
        required: [function () {
            return this.identityType === IdentityType.InvitationCode.code;
        }, 'Invitation Code Expiry is required']
    },
    invitationCodeClaimedTimestamp: {
        type: Date,
        required: [function () {
            return this.identityType === IdentityType.InvitationCode.code &&
                this.invitationCodeStatus === IdentityInvitationCodeStatus.Claimed.code;
        }, 'Invitation Code Claimed Timestamp is required']
    },
    invitationCodeTemporaryEmailAddress: {
        type: String,
        trim: true
    },
    linkIdScheme: {
        type: String,
        trim: true,
        required: [function () {
            return this.identityType === IdentityType.LinkId.code;
        }, 'Link Id Scheme is required'],
        enum: IdentityLinkIdScheme.valueStrings()
    },
    linkIdConsumer: {
        type: String,
        trim: true
    },
    publicIdentifierScheme: {
        type: String,
        trim: true,
        required: [function () {
            return this.identityType === IdentityType.PublicIdentifier.code;
        }, 'Public Identifier Scheme is required'],
        enum: IdentityPublicIdentifierScheme.valueStrings()
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: [true, 'Profile is required']
    },
    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: [true, 'Party is required']
    }
});

mongooseAutoIncrement.initialize(mongoose.connection);
IdentitySchema.plugin(mongooseAutoIncrement.plugin, {model: 'Identity', field: 'seq'});

IdentitySchema.pre('validate', function (next: () => void) {

    // generate id for invitation codes
    const identityType = IdentityType.valueOf(this.identityType) as IdentityType;
    if (identityType === IdentityType.InvitationCode && !this.rawIdValue) {
        this.nextCount((err: Error, count: number) => {
            this.rawIdValue = saltedHashids.encode(count);
            this.idValue = identityType ? identityType.buildIdValue(this) : null;
            next();
        });
    } else {
        this.idValue = identityType ? identityType.buildIdValue(this) : null;
        next();
    }

});

// instance ...........................................................................................................

export interface IIdentity extends IRAMObject {
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
    linkIdScheme: string;
    linkIdConsumer: string;
    publicIdentifierScheme: string;
    profile: IProfile;
    party: IParty;
    identityTypeEnum(): IdentityType;
    agencySchemeEnum(): IdentityAgencyScheme;
    invitationCodeStatusEnum(): IdentityInvitationCodeStatus;
    publicIdentifierSchemeEnum(): IdentityPublicIdentifierScheme;
    linkIdSchemeEnum(): IdentityLinkIdScheme;
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
}

class Identity extends RAMObject implements IIdentity {

    public idValue: string;
    public rawIdValue: string;
    public identityType: string;
    public defaultInd: boolean;
    public strength: number;
    public agencyScheme: string;
    public agencyToken: string;
    public invitationCodeStatus: string;
    public invitationCodeExpiryTimestamp: Date;
    public invitationCodeClaimedTimestamp: Date;
    public invitationCodeTemporaryEmailAddress: string;
    public linkIdScheme: string;
    public linkIdConsumer: string;
    public publicIdentifierScheme: string;
    public profile: IProfile;
    public party: IParty;

    public identityTypeEnum(): IdentityType {
        return IdentityType.valueOf(this.identityType) as IdentityType;
    }

    public agencySchemeEnum(): IdentityAgencyScheme {
        return IdentityAgencyScheme.valueOf(this.agencyScheme);
    }

    public invitationCodeStatusEnum(): IdentityInvitationCodeStatus {
        return IdentityInvitationCodeStatus.valueOf(this.invitationCodeStatus);
    }

    public publicIdentifierSchemeEnum(): IdentityPublicIdentifierScheme {
        return IdentityPublicIdentifierScheme.valueOf(this.publicIdentifierScheme);
    }

    public linkIdSchemeEnum(): IdentityLinkIdScheme {
        return IdentityLinkIdScheme.valueOf(this.linkIdScheme);
    }

    public getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.identity, PermissionEnforcers.identity);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forIdentity(this),
            includeValue ? await this.toDTO() : undefined
        );
    }

    public async toDTO(): Promise<DTO> {
        return new DTO(
            await this.getPermissions(),
            this.idValue,
            this.rawIdValue,
            this.identityType,
            this.defaultInd,
            this.strength,
            this.agencyScheme,
            this.agencyToken,
            this.invitationCodeStatus,
            this.invitationCodeExpiryTimestamp,
            this.invitationCodeClaimedTimestamp,
            this.invitationCodeTemporaryEmailAddress,
            this.publicIdentifierScheme,
            this.linkIdScheme,
            this.linkIdConsumer,
            await this.profile.toDTO(),
            await this.party.toHrefValue(false)
        );
    }

}

interface IIdentityDocument extends IIdentity, mongoose.Document {
}

// static .............................................................................................................

export class IdentityModel {

    public static async create(source: any): Promise<IIdentity> {
        return IdentityMongooseModel.create(source);
    }

    /**
     * Creates an InvitationCode identity required when creating a new relationship. This identity is temporary and will
     * only be associated with the relationship until the relationship is accepted, whereby the relationship will be
     * transferred to the authorised identity.
     */
    /* tslint:disable:max-func-body-length */
    public static async createFromDTO(dto: CreateIdentityDTO): Promise<IIdentity> {

        const name = await NameModel.create({
            givenName: dto.givenName,
            familyName: dto.familyName,
            unstructuredName: dto.unstructuredName
        });

        const sharedSecrets: ISharedSecret[] = [];

        if(dto.sharedSecretTypeCode && dto.sharedSecretValue) {
            sharedSecrets.push(await SharedSecretModel.create({
                value: dto.sharedSecretValue,
                sharedSecretType: await SharedSecretTypeModel.findByCodeInDateRange(dto.sharedSecretTypeCode, new Date())
            } as ISharedSecret));
        }

        const profile = await ProfileModel.create({
            provider: dto.profileProvider,
            name: name,
            sharedSecrets: sharedSecrets
        } as IProfile);

        const party = await PartyModel.create({
            partyType: dto.partyType,
            name: name
        });

        const identity = await IdentityModel.create({
            rawIdValue: dto.rawIdValue,
            identityType: dto.identityType,
            defaultInd: true,
            strength: dto.strength,
            agencyScheme: dto.agencyScheme,
            agencyToken: dto.agencyToken,
            invitationCodeStatus: dto.identityType === IdentityType.InvitationCode.code ? IdentityInvitationCodeStatus.Pending.code : undefined,
            invitationCodeExpiryTimestamp: dto.identityType === IdentityType.InvitationCode.code ? getNewInvitationCodeExpiry() : undefined,
            invitationCodeClaimedTimestamp: undefined,
            publicIdentifierScheme: dto.publicIdentifierScheme,
            linkIdScheme: dto.linkIdScheme,
            linkIdConsumer: dto.linkIdConsumer,
            profile: profile,
            party: party
        } as IIdentity);

        return identity;

    }

    public static async createInvitationCodeIdentity(givenName: string, familyName: string, dateOfBirth: string): Promise<IIdentity> {
        return await IdentityModel
            .createFromDTO(new CreateIdentityDTO(
                undefined,
                PartyType.Individual.code,
                givenName,
                familyName,
                undefined,
                DOB_SHARED_SECRET_TYPE_CODE,
                dateOfBirth,
                IdentityType.InvitationCode.code,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                ProfileProvider.Invitation.code
            ));
    }

    /*
     * Used when looking for a company in the ABR. If the ABN already exists in RAM
     * then only the name needs be checked and/or added (TBD). Otherwise a new identity and associated party are created. In either case the party idValue is returned (PUBLIC_IDENTIFIER:ABN:nnnnnnnnnnn).
     */
    // todo check Paul Marrington's code regarding the DOB for company
    public static async addCompany(abn: string, name: string): Promise<IIdentity> {
        const identity = await IdentityModel.findByIdValue(abn);
        if (identity) {
            return addCompanyNameIfNeeded(identity, name);
        } else {
            const identity = await IdentityModel
                .createFromDTO(new CreateIdentityDTO(
                    abn,
                    PartyType.ABN.code,
                    undefined,
                    undefined,
                    name,
                    // fun - company has to have a date of birth!!!
                    DOB_SHARED_SECRET_TYPE_CODE,
                    '01/07/1984',
                    IdentityType.PublicIdentifier.code,
                    0,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    IdentityPublicIdentifierScheme.ABN.code,
                    ProfileProvider.ABR.code
                ));
            return identity;
        }
    }

    public static async findByIdValue(idValue: string): Promise<IIdentity> {
        return IdentityMongooseModel
            .findOne({
                idValue: idValue
            })
            .deepPopulate([
                'profile.name',
                'profile.sharedSecrets.sharedSecretType',
                'party',
                'partyType'
            ])
            .exec();
    }

    public static async findByInvitationCode(invitationCode: string): Promise<IIdentity> {
        return IdentityMongooseModel
            .findOne({
                rawIdValue: invitationCode,
                identityType: IdentityType.InvitationCode.code
            })
            .deepPopulate([
                'profile.name',
                'profile.sharedSecrets.sharedSecretType',
                'party'
            ])
            .exec();
    }

    public static async findPendingByInvitationCodeInDateRange(invitationCode: string, date: Date): Promise<IIdentity> {
        return IdentityMongooseModel
            .findOne({
                rawIdValue: invitationCode,
                identityType: IdentityType.InvitationCode.code,
                invitationCodeStatus: IdentityInvitationCodeStatus.Pending.code,
                invitationCodeExpiryTimestamp: {$gte: date}
            })
            .deepPopulate([
                'profile.name',
                'profile.sharedSecrets.sharedSecretType',
                'party'
            ])
            .exec();
    }

    public static async findDefaultByPartyId(partyId: string): Promise<IIdentity> {
        return IdentityMongooseModel
            .findOne({
                'party': partyId,
                defaultInd: true
            })
            .deepPopulate([
                'profile.name',
                'profile.sharedSecrets.sharedSecretType',
                'party'
            ])
            .sort({createdAt: 1})
            .exec();
    }

    public static async listByPartyId(partyId: string): Promise<IIdentity[]> {
        return IdentityMongooseModel
            .find({
                'party': partyId
            })
            .deepPopulate([
                'profile.name',
                'profile.sharedSecrets.sharedSecretType',
                'party'
            ])
            .sort({idValue: 1})
            .exec();
    }

    public static async searchLinkIds(page: number, reqPageSize: number): Promise<SearchResult<IIdentity>> {
        return new Promise<SearchResult<IIdentity>>(async(resolve, reject) => {
            const pageSize: number = reqPageSize ? Math.min(reqPageSize, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
            try {
                const query = {
                    identityType: IdentityType.LinkId.code
                };
                const count = await IdentityMongooseModel
                    .count(query)
                    .exec();
                const list = await IdentityMongooseModel
                    .find(query)
                    .deepPopulate([
                        'profile.name',
                        'party'
                    ])
                    .sort({'profile.name._displayName': -1})
                    .skip((page - 1) * pageSize)
                    .limit(pageSize)
                    .exec();
                resolve(new SearchResult<IIdentity>(page, count, pageSize, list));
            } catch (e) {
                reject(e);
            }
        });
    }

}

// concrete model .....................................................................................................

IdentityMongooseModel = Model(
    'Identity',
    IdentitySchema,
    Identity
) as mongoose.Model<IIdentityDocument>;
