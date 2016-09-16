import * as mongoose from 'mongoose';
import {Model, RAMEnum, RAMSchema, IRAMObject, RAMObject, Query, Assert} from './base';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';
import {Url} from './url';
import {SharedSecretModel, ISharedSecret} from './sharedSecret.model';
import {DOB_SHARED_SECRET_TYPE_CODE, SharedSecretTypeModel} from './sharedSecretType.model';
import {IParty, PartyModel, PartyType} from './party.model';
import {IName, NameModel} from './name.model';
import {IRelationshipType, RelationshipTypeModel} from './relationshipType.model';
import {IRelationshipAttribute, RelationshipAttributeModel} from './relationshipAttribute.model';
import {RelationshipAttributeNameModel, RelationshipAttributeNameClassifier, IRelationshipAttributeName} from './relationshipAttributeName.model';
import {ProfileProvider} from './profile.model';
import {Constants} from '../../../commons/constants';
import {
    IdentityModel,
    IIdentity,
    IdentityType,
    IdentityInvitationCodeStatus,
    IdentityPublicIdentifierScheme
} from './identity.model';
import {
    HrefValue,
    Relationship as DTO,
    RelationshipStatus as RelationshipStatusDTO,
    RelationshipAttribute as RelationshipAttributeDTO,
    RelationshipAttributeName as RelationshipAttributeNameDTO,
    SearchResult
} from '../../../commons/api';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {IdentityCanCreateRelationshipPermissionEnforcer} from '../permissions/identityCanCreateRelationshipPermission.enforcer';
import {RelationshipCanClaimPermissionEnforcer} from '../permissions/relationshipCanClaimPermission.enforcer';
import {RelationshipCanNotifyDelegatePermissionEnforcer} from '../permissions/relationshipCanNotifyDelegatePermission.enforcer';
import {RelationshipCanRejectPermissionEnforcer} from '../permissions/relationshipCanRejectPermission.enforcer';
import {RelationshipCanAcceptPermissionEnforcer} from '../permissions/relationshipCanAcceptPermission.enforcer';
import {RelationshipCanModifyPermissionEnforcer} from '../permissions/relationshipCanModifyPermission.enforcer';
import {Utils} from '../../../commons/utils';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _PartyModel = PartyModel;
const _NameModel = NameModel;
const _RelationshipAttributeModel = RelationshipAttributeModel;
const _RelationshipAttributeNameModel = RelationshipAttributeNameModel;
const _RelationshipTypeModel = RelationshipTypeModel;
/* tslint:enable:no-unused-variable */

const MAX_PAGE_SIZE = 10;

// mongoose ...........................................................................................................

let RelationshipMongooseModel: mongoose.Model<IRelationshipDocument>;

// enums, utilities, helpers ..........................................................................................

export class RelationshipStatus extends RAMEnum {

    public static Accepted = new RelationshipStatus('ACCEPTED', 'Accepted');
    public static Cancelled = new RelationshipStatus('CANCELLED', 'Cancelled');
    public static Declined = new RelationshipStatus('DECLINED', 'Declined');
    public static Deleted = new RelationshipStatus('DELETED', 'Deleted');
    public static Pending = new RelationshipStatus('PENDING', 'Pending');
    public static Revoked = new RelationshipStatus('REVOKED', 'Revoked');
    public static Suspended = new RelationshipStatus('SUSPENDED', 'Suspended');
    public static Superseded = new RelationshipStatus('SUPERSEDED', 'Superseded');

    protected static AllValues = [
        RelationshipStatus.Accepted,
        RelationshipStatus.Cancelled,
        RelationshipStatus.Declined,
        RelationshipStatus.Deleted,
        RelationshipStatus.Pending,
        RelationshipStatus.Revoked,
        RelationshipStatus.Suspended,
        RelationshipStatus.Superseded
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<RelationshipStatusDTO>> {
        return Promise.resolve(new HrefValue(
            await Url.forRelationshipStatus(this),
            includeValue ? this.toDTO() : undefined
        ));
    }

    public toDTO(): RelationshipStatusDTO {
        return new RelationshipStatusDTO(this.code, this.shortDecodeText);
    }
}

export class RelationshipInitiatedBy extends RAMEnum {

    public static Subject = new RelationshipInitiatedBy('SUBJECT', 'Subject');
    public static Delegate = new RelationshipInitiatedBy('DELEGATE', 'Delegate');

    protected static AllValues = [
        RelationshipInitiatedBy.Subject,
        RelationshipInitiatedBy.Delegate
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

// schema .............................................................................................................

const RelationshipSchema = RAMSchema({
    relationshipType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RelationshipType',
        required: [true, 'Relationship Type is required']
    },
    strength: {
        type: Number,
        required: [true, 'Strength is required'],
        default: 0
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: [true, 'Subject is required']
    },
    subjectNickName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Name',
        required: [true, 'Subject Nick Name is required']
    },
    delegate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: [true, 'Delegate is required']
    },
    delegateNickName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Name',
        required: [true, 'Delegate Nick Name is required']
    },
    invitationIdentity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Identity'
    },
    startTimestamp: {
        type: Date,
        required: [true, 'Start Timestamp is required']
    },
    endTimestamp: {
        type: Date,
        set: function (value: String) {
            if (value) {
                this.endEventTimestamp = new Date();
            }
            return value;
        }
    },
    endEventTimestamp: {
        type: Date,
        required: [function () {
            return this.endTimestamp;
        }, 'End Event Timestamp is required']
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        trim: true,
        enum: RelationshipStatus.valueStrings()
    },
    initiatedBy: {
        type: String,
        required: [true, 'Initiated by is required'],
        trim: true,
        enum: RelationshipInitiatedBy.valueStrings()
    },
    supersededBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Relationship'
    },
    supersedes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Relationship'
    },
    attributes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RelationshipAttribute'
    }],
    _relationshipTypeCode: {
        type: String,
        required: [true, 'Relationship Type Code is required'],
        trim: true
    },
    _relationshipTypeCategory: {
        type: String,
        required: [true, 'Relationship Type Category is required'],
        trim: true
    },
    _subjectNickNameString: {
        type: String,
        required: [true, 'Subject Nick Name String is required'],
        trim: true
    },
    _delegateNickNameString: {
        type: String,
        required: [true, 'Delegate NickName String is required'],
        trim: true
    },
    _subjectABNString: {
        type: String,
        trim: true
    },
    _delegateABNString: {
        type: String,
        trim: true
    },
    _subjectPartyTypeCode: {
        type: String,
        required: [true, 'Subject Party Type Code is required'],
        trim: true
    },
    _delegatePartyTypeCode: {
        type: String,
        required: [true, 'Delegate Party Type Code is required'],
        trim: true
    },
    _subjectProfileProviderCodes: [{
        type: String
    }],
    _delegateProfileProviderCodes: [{
        type: String
    }]
});

RelationshipSchema.pre('validate', function (next: () => void) {
    if (this.relationshipType) {
        this._relationshipTypeCode = this.relationshipType.code;
    }
    if (this.relationshipType) {
        this.strength = this.relationshipType.strength;
    }
    if (this.relationshipType) {
        this._relationshipTypeCategory = this.relationshipType.category;
    }
    if (this.subjectNickName) {
        this._subjectNickNameString = this.subjectNickName._displayName;
    }
    if (this.delegateNickName) {
        this._delegateNickNameString = this.delegateNickName._displayName;
    }
    this._subjectPartyTypeCode = this.subject.partyType;
    this._delegatePartyTypeCode = this.delegate.partyType;
    const subjectPromise = IdentityModel.listByPartyId(this.subject.id)
        .then((identities: IIdentity[]) => {
            this._subjectProfileProviderCodes = [];
            for (let identity of identities) {
                this._subjectProfileProviderCodes.push(identity.profile.provider);
                if (identity.publicIdentifierScheme === IdentityPublicIdentifierScheme.ABN.code) {
                    this._subjectABNString = identity.rawIdValue;
                }
            }
        });
    const delegatePromise = IdentityModel.listByPartyId(this.delegate.id)
        .then((identities: IIdentity[]) => {
            this._delegateProfileProviderCodes = [];
            for (let identity of identities) {
                this._delegateProfileProviderCodes.push(identity.profile.provider);
                if (identity.publicIdentifierScheme === IdentityPublicIdentifierScheme.ABN.code) {
                    this._delegateABNString = identity.rawIdValue;
                }
            }
        });
    Promise.all([subjectPromise, delegatePromise])
        .then(() => {
            next();
        })
        .catch((err: Error) => {
            next();
        });
});

// instance ............................................................................................................

export interface IRelationship extends IRAMObject {
    id: string;
    relationshipType: IRelationshipType;
    strength: number;
    subject: IParty;
    subjectNickName: IName;
    delegate: IParty;
    delegateNickName: IName;
    invitationIdentity: IIdentity;
    startTimestamp: Date;
    endTimestamp?: Date;
    endEventTimestamp?: Date;
    status: string;
    initiatedBy: string;
    supersededBy: IRelationship;
    supersedes: IRelationship;
    attributes: IRelationshipAttribute[];
    _subjectNickNameString: string;
    _delegateNickNameString: string;
    _subjectABNString: string;
    _delegateABNString: string;
    _subjectPartyTypeCode: string;
    _delegatePartyTypeCode: string;
    _relationshipTypeCode: string;
    _subjectProfileProviderCodes: string[];
    _delegateProfileProviderCodes: string[];
    statusEnum(): RelationshipStatus;
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
    isPendingInvitation(): Promise<boolean>;
    claimPendingInvitation(claimingDelegateIdentity: IIdentity, invitationCode: string): Promise<IRelationship>;
    acceptPendingInvitation(acceptingDelegateIdentity: IIdentity): Promise<IRelationship>;
    rejectPendingInvitation(rejectingDelegateIdentity: IIdentity): Promise<IRelationship>;
    notifyDelegate(email: string, notifyingIdentity: IIdentity): Promise<IRelationship>;
    modify(dto: DTO): Promise<IRelationship>;
    getAttribute(code: string): Promise<IRelationshipAttribute>;
    isManageAuthAllowed(): Promise<boolean>;
}

class Relationship extends RAMObject implements IRelationship {

    public id: string;
    public relationshipType: IRelationshipType;
    public strength: number;
    public subject: IParty;
    public subjectNickName: IName;
    public delegate: IParty;
    public delegateNickName: IName;
    public invitationIdentity: IIdentity;
    public startTimestamp: Date;
    public endTimestamp: Date;
    public endEventTimestamp: Date;
    public status: string;
    public initiatedBy: string;
    public supersededBy: IRelationship;
    public supersedes: IRelationship;
    public attributes: IRelationshipAttribute[];
    public _subjectNickNameString: string;
    public _delegateNickNameString: string;
    public _subjectABNString: string;
    public _delegateABNString: string;
    public _subjectPartyTypeCode: string;
    public _delegatePartyTypeCode: string;
    public _relationshipTypeCode: string;
    public _subjectProfileProviderCodes: string[];
    public _delegateProfileProviderCodes: string[];

    public statusEnum(): RelationshipStatus {
        return RelationshipStatus.valueOf(this.status) as RelationshipStatus;
    }

    public getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.relationship, PermissionEnforcers.relationship);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forRelationship(this),
            includeValue ? await this.toDTO() : undefined
        );
    }

    public async toDTO(): Promise<DTO> {

        // map attribute models to dtos
        const attributeDTOs: RelationshipAttributeDTO[] = await Promise.all<RelationshipAttributeDTO>(
            this.attributes.map(async(attribute: IRelationshipAttribute) => await attribute.toDTO())
        );

        // get relationship type attribute name usages which have appliesToInstance
        const relationshipType = await RelationshipTypeModel.findByCodeIgnoringDateRange(this.relationshipType.code);
        relationshipType.attributeNameUsages
            .filter((attributeNameUsage) => attributeNameUsage.attributeName.appliesToInstance)
            .forEach(async(attributeNameUsage) => {
                const matchedAttributeDTO = attributeDTOs.find((attributeDTO: RelationshipAttributeDTO) => attributeNameUsage.attributeName.code === attributeDTO.attributeName.value.code);
                if (!matchedAttributeDTO) {
                    attributeDTOs.push(
                        new RelationshipAttributeDTO(
                            attributeNameUsage.defaultValue ? [attributeNameUsage.defaultValue] : [],
                            new HrefValue(await Url.forRelationshipAttributeName(attributeNameUsage.attributeName), RelationshipAttributeNameDTO.build(attributeNameUsage.attributeName))
                        )
                    );
                }
            });

        return new DTO(
            await this.getPermissions(),
            await this.relationshipType.toHrefValue(false),
            await this.subject.toHrefValue(true),
            await this.subjectNickName.toDTO(),
            await this.delegate.toHrefValue(true),
            await this.delegateNickName.toDTO(),
            this.startTimestamp,
            this.endTimestamp,
            this.endEventTimestamp,
            this.status,
            this.initiatedBy,
            this.supersededBy ? await this.supersededBy.toHrefValue(false) : undefined,
            attributeDTOs
        );
    }

    public async isPendingInvitation(): Promise<boolean> {
        let invitationCode = this.invitationIdentity ? this.invitationIdentity.rawIdValue : undefined;
        return invitationCode !== null && invitationCode !== undefined && this.statusEnum() === RelationshipStatus.Pending;
    }

    public async claimPendingInvitation(claimingDelegateIdentity: IIdentity, invitationCode: string): Promise<IRelationship> {

        // evaluate permissions
        await new RelationshipCanClaimPermissionEnforcer().assert(this);

        // if the user is already the delegate then there is nothing to do
        if (this.delegate.id === claimingDelegateIdentity.party.id) {
            return this as IRelationship;
        }

        // ensure invitation code matches
        Assert.assertTrue(
            this.invitationIdentity.rawIdValue === invitationCode,
            'Invitation code does not match'
        );

        // mark invitation code identity as claimed
        this.invitationIdentity.invitationCodeStatus = IdentityInvitationCodeStatus.Claimed.code;
        this.invitationIdentity.invitationCodeClaimedTimestamp = new Date();
        await this.invitationIdentity.save();

        // point relationship to the accepting delegate identity
        this.delegate = claimingDelegateIdentity.party;
        await this.save();

        return this;

    }

    public async acceptPendingInvitation(acceptingDelegateIdentity: IIdentity): Promise<IRelationship> {

        // evaluate permissions
        await new RelationshipCanAcceptPermissionEnforcer().assert(this);

        // mark relationship as active
        this.status = RelationshipStatus.Accepted.code;

        // if this relationship is superseding then end date superseded relationship
        if (this.supersedes) {
            const date = new Date();
            date.setHours(0, 0, 0);

            const supersededRelationship = await RelationshipModel.findByIdentifier(this.supersedes.toString());
            supersededRelationship.status = RelationshipStatus.Superseded.code;
            supersededRelationship.endTimestamp = date;
            supersededRelationship.supersededBy = this;
            await supersededRelationship.save();
            this.startTimestamp = date;
        }
        await this.save();

        // TODO notify relevant parties

        return this;

    }

    public async rejectPendingInvitation(rejectingDelegateIdentity: IIdentity): Promise<IRelationship> {

        // evaluate permissions
        await new RelationshipCanRejectPermissionEnforcer().assert(this);

        // confirm the delegate is the user accepting
        Assert.assertTrue(rejectingDelegateIdentity.party.id === this.delegate.id, 'Not allowed');

        // mark relationship as invalid
        this.status = RelationshipStatus.Declined.code;
        await this.save();

        // TODO notify relevant parties

        return this;

    }

    public async notifyDelegate(email: string, notifyingIdentity: IIdentity): Promise<IRelationship> {

        // evaluate permissions
        await new RelationshipCanNotifyDelegatePermissionEnforcer().assert(this);

        // update email address
        const identity = this.invitationIdentity;
        identity.invitationCodeTemporaryEmailAddress = email;
        await identity.save();

        // TODO notify relevant parties

        return this;

    }

    public async modify(dto: DTO): Promise<IRelationship> {

        // lookup identities, evaluate permissions on these
        const subjectIdentity = await IdentityModel.findByIdValue(Url.lastPathElement(dto.subject.href));
        const delegateIdentity = await IdentityModel.findByIdValue(Url.lastPathElement(dto.delegate.href));

        // update fields before permission evaluation
        this.relationshipType = await RelationshipTypeModel.findByCodeIgnoringDateRange(Url.lastPathElement(dto.relationshipType.href));
        this.subject = subjectIdentity.party;
        this.delegate = delegateIdentity.party;
        this.invitationIdentity = await this.mergeInvitationIdentityIfRequired(dto);
        if (this.invitationIdentity) {
            this.delegateNickName = this.invitationIdentity.profile.name;
        }
        this.attributes = await RelationshipModel.mergeAttributes(this.relationshipType, this.attributes, dto.attributes as RelationshipAttributeDTO[]);
        this.startTimestamp = dto.startTimestamp;
        this.endTimestamp = dto.endTimestamp;

        // zero hours on timestamps
        Utils.startOfDate(this.startTimestamp);
        Utils.startOfDate(this.endTimestamp);

        // evaluate permissions
        await new RelationshipCanModifyPermissionEnforcer().assert(this);

        const originalRelationship = await RelationshipModel.findByIdentifier(this.id);
        const startTimestampSame = Utils.startOfDate(originalRelationship.startTimestamp).getTime() === this.startTimestamp.getTime();
        const startTimestampFutureDated = Utils.dateIsInFuture(this.startTimestamp);
        const startTimestampNotGreaterThanToday = !Utils.dateIsTodayOrInFuture(this.startTimestamp);

        // check accepted relationship start timestamp not changed into the past
        if (this.statusEnum() === RelationshipStatus.Accepted && !startTimestampSame && startTimestampNotGreaterThanToday) {
            throw new Error('400:Relationship access period start date can not be changed to a past date');
        }

        // check start date not greater than end date
        if (this.endTimestamp && this.startTimestamp > this.endTimestamp) {
            throw new Error('400:Relationship access period start date can not be greater than end date');
        }

        // if re-acceptance required, create new pending relationship
        if (await this.isReAcceptanceRequired()) {
            const supersededPendingRelationship = await RelationshipModel.createFromDto(dto);
            const invitationIdentity = await IdentityModel.createInvitationCodeIdentity(this.delegateNickName.givenName, this.delegateNickName.familyName, null);
            supersededPendingRelationship.delegate = invitationIdentity.party;
            supersededPendingRelationship.invitationIdentity = invitationIdentity;
            supersededPendingRelationship.supersedes = this;
            return supersededPendingRelationship.save();
        }

        // if start date future dated and is accepted, create new accepted relationship
        if (this.statusEnum() === RelationshipStatus.Accepted && !startTimestampSame && startTimestampFutureDated) {
            this.endTimestamp = Utils.startOfToday();
            this.status = RelationshipStatus.Cancelled.code;
            await this.save();
            const newFutureDatedAcceptedRelationship = await RelationshipModel.createFromDto(dto);
            newFutureDatedAcceptedRelationship.status = RelationshipStatus.Accepted.code;
            return newFutureDatedAcceptedRelationship.save();
        }

        // general flow - save relationship and cascade save on dependents
        await this.save();
        if (this.invitationIdentity) {
            await this.invitationIdentity.profile.name.save();
            await this.invitationIdentity.profile.save();
            await this.invitationIdentity.save();
        }
        for (let attribute of this.attributes) {
            await attribute.save();
        }

        return this;
    }

    private async isReAcceptanceRequired(): Promise<boolean> {
        let reAcceptanceRequired = false;

        // re-acceptance can only happen while accepted
        if (this.status === RelationshipStatus.Accepted.code) {

            // re-acceptance determined by comparing against original relationship
            const originalRelationship = await RelationshipModel.findByIdentifier(this.id);

            // has relationship type been upgraded via the relationship strength
            const minIdentityStrengthUpgraded = this.relationshipType.minIdentityStrength > originalRelationship.relationshipType.minIdentityStrength;
            if (minIdentityStrengthUpgraded) {
                console.info('Re-acceptance required due to relationship strength change');
                reAcceptanceRequired = true;
            }

            // has authorisation management been changed from no to yes
            const relationshipAttributeDelegateManageAuthorisationAllowedInd = await originalRelationship.getAttribute(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND);
            if (relationshipAttributeDelegateManageAuthorisationAllowedInd) {
                if (relationshipAttributeDelegateManageAuthorisationAllowedInd.value[0] === 'false') {
                    const dtoRelationshipAttributeDelegateManageAuthorisationAllowedInd = await this.getAttribute(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND);
                    if (dtoRelationshipAttributeDelegateManageAuthorisationAllowedInd) {
                        if (dtoRelationshipAttributeDelegateManageAuthorisationAllowedInd.value[0] === 'true') {
                            console.info('Re-acceptance required due to authorisation management upgrade');
                            reAcceptanceRequired = true;
                        }
                    }
                }
            }

            // have more government services been added
            for (let attribute of this.attributes) {
                if (attribute.attributeName.classifier === Constants.RelationshipAttributeNameClassifier.PERMISSION) {

                    const originalAttribute = await originalRelationship.getAttribute(attribute.attributeName.code);

                    // service was added
                    if (!originalAttribute) {

                        console.info('Re-acceptance required due addition of government service');
                        reAcceptanceRequired = true;

                    } else if (attribute.value && attribute.value.length > 0) {

                        // has the permission been changed from limited to full
                        const permittedValues = originalAttribute.attributeName.permittedValues;
                        const originalPermissionAttributeValueIndex = permittedValues.findIndex((value: string) => value === originalAttribute.value[0]);
                        const permissionAttributeValueIndex = permittedValues.findIndex((value: string) => value === attribute.value[0]);
                        const attributeValueValid = permittedValues.find((value: string) => value === attribute.value[0]);
                        if (attributeValueValid) {
                            const previouslyHadNoValueButNowDoes = originalPermissionAttributeValueIndex === -1 && permissionAttributeValueIndex >= 0;
                            if (previouslyHadNoValueButNowDoes) {
                                console.info('Re-acceptance required due to upgrading of access level');
                                reAcceptanceRequired = true;
                            }
                        }

                    }

                }
            }
        }

        return Promise.resolve(reAcceptanceRequired);
    }

    private async mergeInvitationIdentityIfRequired(dto: DTO): Promise<IIdentity> {
        let invitationIdentity = this.invitationIdentity;
        let delegateIdentity = await IdentityModel.findDefaultByPartyId(this.delegate.id);

        const isSubjectUpdatingRelationshipInvitation =
            dto.initiatedBy === RelationshipInitiatedBy.Subject.code
            && dto.delegate.href
            && dto.delegate.value
            && dto.delegate.value.partyType === PartyType.Individual.code
            && dto.delegate.value.identities.length === 1
            && dto.delegate.value.identities[0].value
            && dto.delegate.value.identities[0].value.identityType === IdentityType.InvitationCode.code
            && dto.delegate.value.identities[0].value.profile.provider === ProfileProvider.Invitation.code;

        if (isSubjectUpdatingRelationshipInvitation) {
            delegateIdentity.profile.name.givenName = dto.delegate.value.identities[0].value.profile.name.givenName;
            delegateIdentity.profile.name.familyName = dto.delegate.value.identities[0].value.profile.name.familyName;

            const hasSharedSecretValue = dto.delegate.value.identities[0].value.profile.sharedSecrets
                && dto.delegate.value.identities[0].value.profile.sharedSecrets.length === 1
                && dto.delegate.value.identities[0].value.profile.sharedSecrets[0].value;

            delegateIdentity.profile.sharedSecrets = [];
            if (hasSharedSecretValue) {
                const sharedSecretValue = dto.delegate.value.identities[0].value.profile.sharedSecrets[0].value;
                const sharedSecretType = await SharedSecretTypeModel.findByCodeIgnoringDateRange(DOB_SHARED_SECRET_TYPE_CODE);
                const sharedSecret = await SharedSecretModel.create({
                    value: sharedSecretValue,
                    sharedSecretType: sharedSecretType
                } as ISharedSecret);
                delegateIdentity.profile.sharedSecrets.push(sharedSecret);
            }
            invitationIdentity = delegateIdentity;
        }

        return invitationIdentity;
    }

    public async getAttribute(code: string): Promise<IRelationshipAttribute> {
        let attribute: IRelationshipAttribute;
        if (this.attributes) {
            attribute = this.attributes.find((attribute) => attribute.attributeName.code === code);
        }
        if (!attribute) {
            const relationshipType = await RelationshipTypeModel.findByCodeIgnoringDateRange(this.relationshipType.code);
            const relationshipAttributeNameUsage = relationshipType.findAttributeNameUsage(code);
            if (relationshipAttributeNameUsage && relationshipAttributeNameUsage.attributeName.appliesToInstance) {
                attribute = await RelationshipAttributeModel.createInstance(relationshipAttributeNameUsage);
            }
        }
        return Promise.resolve(attribute);
    }

    public async isManageAuthAllowed(): Promise<boolean> {
        let attribute = await this.getAttribute(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND);
        if (attribute && attribute.value && attribute.value.length > 0) {
            return 'true' === attribute.value[0];
        }
        return false;
    }

}

interface IRelationshipDocument extends IRelationship, mongoose.Document {
}

// static ..............................................................................................................

export class RelationshipModel {

    public static async create(source: IRelationship): Promise<IRelationship> {
        return RelationshipMongooseModel.create(source);
    }

    public static async createFromDto(dto: DTO): Promise<IRelationship> {

        // verify permissions
        let subjectIdentity = await IdentityModel.findByIdValue(Url.lastPathElement(dto.subject.href));
        new IdentityCanCreateRelationshipPermissionEnforcer().evaluate(subjectIdentity);

        // delegate identity if exists - href does not exist for invitation and value is for creation
        const delegateIdValue = Url.lastPathElement(dto.delegate.href);
        let delegateIdentity: IIdentity;
        if (delegateIdValue) {
            delegateIdentity = await IdentityModel.findByIdValue(delegateIdValue);
        }

        // get relationship members
        const relationshipType = await RelationshipTypeModel.findByCodeIgnoringDateRange(Url.lastPathElement(dto.relationshipType.href));
        const initiatedBy = RelationshipInitiatedBy.valueOf(dto.initiatedBy);
        const invitationIdentity: IIdentity = await this.createInvitationIdentityIfRequired(dto);
        let startTimestamp: Date = dto.startTimestamp;
        let endTimestamp: Date = dto.endTimestamp;
        const attributes: IRelationshipAttribute[] = await this.mergeAttributes(relationshipType, [], dto.attributes as RelationshipAttributeDTO[]);

        // if invitation identity has been created, then this is the temporary delegate identity
        if (invitationIdentity) {
            delegateIdentity = invitationIdentity;
        }

        // zero hours on timestamps
        Utils.startOfDate(startTimestamp);
        Utils.startOfDate(endTimestamp);

        // check start date not past date
        if (!Utils.dateIsTodayOrInFuture(startTimestamp)) {
            throw new Error('400:Relationship access period start date can not be a past date');
        }

        // check start date not greater than end date
        if (endTimestamp && startTimestamp > endTimestamp) {
            throw new Error('400:Relationship access period start date can not be greater than end date');
        }

        Assert.assertNotNull(subjectIdentity, 'Subject identity not found');
        Assert.assertNotNull(delegateIdentity, 'Delegate identity not found');

        return this.add(
            relationshipType,
            subjectIdentity.party,
            subjectIdentity.profile.name,
            delegateIdentity.party,
            delegateIdentity.profile.name,
            startTimestamp,
            endTimestamp,
            initiatedBy,
            invitationIdentity,
            attributes
        );
    }

    // this is a static method because we may be constructing attributes for a new relationship that has not been created yet
    public static async updateOrAddAttribute(attributes: IRelationshipAttribute[], attributeName: IRelationshipAttributeName, attributeValue: string[]): Promise<void> {
        if (attributes && attributeName) {
            const matchedAttribute = attributes.find((attribute) => attribute.attributeName.code === attributeName.code);
            if (matchedAttribute) {
                matchedAttribute.value = attributeValue;
            } else {
                attributes.push(await RelationshipAttributeModel.add(attributeValue, attributeName));
            }
        }
    }

    public static async add(relationshipType: IRelationshipType,
                     subject: IParty,
                     subjectNickName: IName,
                     delegate: IParty,
                     delegateNickName: IName,
                     startTimestamp: Date,
                     endTimestamp: Date,
                     initiatedBy: RelationshipInitiatedBy,
                     invitationIdentity: IIdentity,
                     attributes: IRelationshipAttribute[]): Promise<IRelationship> {

        let status = RelationshipStatus.Pending;

        // check subject - OSP relationship type this is case when
        if (initiatedBy === RelationshipInitiatedBy.Subject && relationshipType.findAttributeNameUsage(Constants.RelationshipAttributeNameCode.AUTOACCEPT_IF_INITIATED_FROM_SUBJECT_IND) !== null) {
            status = RelationshipStatus.Accepted;
        }

        // check delegate
        if (initiatedBy === RelationshipInitiatedBy.Delegate && relationshipType.findAttributeNameUsage(Constants.RelationshipAttributeNameCode.AUTOACCEPT_IF_INITIATED_FROM_DELEGATE_IND) !== null) {
            status = RelationshipStatus.Accepted;
        }

        return RelationshipModel.create({
            relationshipType: relationshipType,
            subject: subject,
            subjectNickName: subjectNickName,
            delegate: delegate,
            delegateNickName: delegateNickName,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            status: status.code,
            initiatedBy: initiatedBy.code,
            invitationIdentity: invitationIdentity,
            attributes: attributes
            } as any
        );

    }

    public static async findOne(conditions: any): Promise<IRelationship> {
        return RelationshipMongooseModel.findOne(conditions).exec();
    }

    public static async findByIdentifier(id: string): Promise<IRelationship> {
        // TODO migrate from _id to another id
        return RelationshipMongooseModel
            .findOne({
                _id: id
            })
            .deepPopulate([
                'relationshipType',
                'subject',
                'subjectNickName',
                'delegate',
                'delegateNickName',
                'invitationIdentity.profile.name',
                'attributes.attributeName'
            ])
            .exec();
    }

    public static async findByInvitationCode(invitationCode: string): Promise<IRelationship> {
        const identity = await IdentityModel.findByInvitationCode(invitationCode);
        if (identity) {
            return RelationshipMongooseModel
                .findOne({
                    invitationIdentity: identity
                })
                .deepPopulate([
                    'relationshipType',
                    'subject',
                    'subjectNickName',
                    'delegate',
                    'delegateNickName',
                    'invitationIdentity.profile.name',
                    'invitationIdentity.profile.sharedSecrets',
                    'attributes.attributeName'
                ])
                .exec();
        }
        return null;
    }

    public static async findPendingByInvitationCodeInDateRange(invitationCode: string, date: Date): Promise<IRelationship> {
        const identity = await IdentityModel.findPendingByInvitationCodeInDateRange(invitationCode, date);
        if (identity) {
            const delegate = identity.party;
            return RelationshipMongooseModel
                .findOne({
                    delegate: delegate
                })
                .deepPopulate([
                    'relationshipType',
                    'subject',
                    'subjectNickName',
                    'delegate',
                    'delegateNickName',
                    'invitationIdentity.profile.name',
                    'invitationIdentity.profile.sharedSecrets',
                    'attributes.attributeName'
                ])
                .exec();
        }
        return null;
    }

    public static async hasActiveInDateRange1stOr2ndLevelConnection(requestingParty: IParty, requestedIdValue: string, date: Date): Promise<boolean> {

        const requestedParty = await PartyModel.findByIdentityIdValue(requestedIdValue);

        if (!requestedParty) {
            // no such subject
            return Promise.resolve(null);
        } else {

            // 1st level

            const firstLevelRelationship = await RelationshipMongooseModel
                .findOne({
                    subject: requestedParty,
                    delegate: requestingParty,
                    status: RelationshipStatus.Accepted.code,
                    startTimestamp: {$lte: date},
                    $or: [{endTimestamp: null}, {endTimestamp: {$gte: date}}]
                })
                .exec();

            if (firstLevelRelationship) {
                return true;
            } else {

                // 2nd level

                const listOfDelegateIds = await RelationshipMongooseModel
                    .aggregate([
                        {
                            '$match': {
                                '$and': [
                                    {'subject': new mongoose.Types.ObjectId(requestedParty.id)},
                                    {'delegate': {'$ne': new mongoose.Types.ObjectId(requestingParty.id)}},
                                    {'status': RelationshipStatus.Accepted.code},
                                    {'startTimestamp': {$lte: date}},
                                    {'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]}
                                ]
                            }
                        },
                        {'$group': {'_id': '$delegate'}}
                    ])
                    .exec();

                const listOfSubjectIds = await RelationshipMongooseModel
                    .aggregate([
                        {
                            '$match': {
                                '$and': [
                                    {'subject': {'$ne': new mongoose.Types.ObjectId(requestedParty.id)}},
                                    {'delegate': new mongoose.Types.ObjectId(requestingParty.id)},
                                    {'status': RelationshipStatus.Accepted.code},
                                    {'startTimestamp': {$lte: date}},
                                    {'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]}
                                ]
                            }
                        },
                        {'$group': {'_id': '$subject'}}
                    ])
                    .exec();

                let arrays = [
                    listOfDelegateIds.map((obj: {_id: string}): string => obj['_id'].toString()),
                    listOfSubjectIds.map((obj: {_id: string}): string => obj['_id'].toString())
                ];

                const listOfIntersectingPartyIds = arrays.shift().filter(function (v: string) {
                    return arrays.every(function (a) {
                        return a.indexOf(v) !== -1;
                    });
                });

                return listOfIntersectingPartyIds.length > 0;

            }

        }
    }

    public static async computeConnectionStrength(requestingParty: IParty, requestedIdValue: string, date: Date): Promise<number> {

        const requestedParty = await PartyModel.findByIdentityIdValue(requestedIdValue);

        const manageAuthStrengthOffset = 0.5;

        if (!requestedParty) {
            // no such subject
            return Promise.resolve(0);
        } else {

            let strongestStrength = 0;

            // 1st level

            const strongestFirstLevelRelationship = await RelationshipMongooseModel
                .findOne({
                    subject: requestedParty,
                    delegate: requestingParty,
                    status: RelationshipStatus.Accepted.code,
                    startTimestamp: {$lte: date},
                    $or: [{endTimestamp: null}, {endTimestamp: {$gte: date}}]
                })
                .deepPopulate([
                    'attributes.attributeName'
                ])
                .sort({strength: -1})
                .exec();

            if (strongestFirstLevelRelationship) {
                strongestStrength = strongestFirstLevelRelationship.strength;
                if (await strongestFirstLevelRelationship.isManageAuthAllowed()) {
                    strongestStrength = strongestStrength + manageAuthStrengthOffset;
                }
            }

            // 2nd level

            const listOfDelegateIds = await RelationshipMongooseModel
                .aggregate([
                    {
                        '$match': {
                            '$and': [
                                {'subject': new mongoose.Types.ObjectId(requestedParty.id)},
                                {'delegate': {'$ne': new mongoose.Types.ObjectId(requestingParty.id)}},
                                {'status': RelationshipStatus.Accepted.code},
                                {'startTimestamp': {$lte: date}},
                                {'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]}
                            ]
                        }
                    },
                    {'$group': {'_id': '$delegate'}}
                ])
                .exec();

            const listOfSubjectIds = await RelationshipMongooseModel
                .aggregate([
                    {
                        '$match': {
                            '$and': [
                                {'subject': {'$ne': new mongoose.Types.ObjectId(requestedParty.id)}},
                                {'delegate': new mongoose.Types.ObjectId(requestingParty.id)},
                                {'status': RelationshipStatus.Accepted.code},
                                {'startTimestamp': {$lte: date}},
                                {'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]}
                            ]
                        }
                    },
                    {'$group': {'_id': '$subject'}}
                ])
                .exec();

            let arrays = [
                listOfDelegateIds.map((obj: {_id: string}): string => obj['_id'].toString()),
                listOfSubjectIds.map((obj: {_id: string}): string => obj['_id'].toString())
            ];

            const listOfIntersectingPartyIds = arrays.shift().filter(function (v: string) {
                return arrays.every(function (a) {
                    return a.indexOf(v) !== -1;
                });
            });

            listOfIntersectingPartyIds.forEach(async(partyId: string) => {
                let party = await PartyModel.findById(partyId);
                let relationship_intermediaryParty_to_requestingParty = await RelationshipMongooseModel
                    .findOne({
                        subject: party,
                        delegate: requestingParty,
                        status: RelationshipStatus.Accepted.code,
                        startTimestamp: {$lte: date},
                        $or: [{endTimestamp: null}, {endTimestamp: {$gte: date}}]
                    })
                    .deepPopulate([
                        'attributes.attributeName'
                    ])
                    .sort({strength: -1})
                    .exec();
                let relationship_requestedParty_to_intermediaryParty = await RelationshipMongooseModel
                    .findOne({
                        subject: requestedParty,
                        delegate: party,
                        status: RelationshipStatus.Accepted.code,
                        startTimestamp: {$lte: date},
                        $or: [{endTimestamp: null}, {endTimestamp: {$gte: date}}]
                    })
                    .deepPopulate([
                        'attributes.attributeName'
                    ])
                    .sort({strength: -1})
                    .exec();
                if (relationship_intermediaryParty_to_requestingParty && relationship_requestedParty_to_intermediaryParty) {
                    let strength = Math.min(
                        relationship_intermediaryParty_to_requestingParty.strength,
                        relationship_requestedParty_to_intermediaryParty.strength
                    );
                    if (await relationship_intermediaryParty_to_requestingParty.isManageAuthAllowed() &&
                        await relationship_requestedParty_to_intermediaryParty.isManageAuthAllowed()) {
                        strength = strength + manageAuthStrengthOffset;
                    }
                    strongestStrength = Math.max(strength, strongestStrength);
                }
            });

            return Promise.resolve(strongestStrength);

        }

    }

    // todo this search might no longer be useful from SS2
    public static async search(subjectIdentityIdValue: string, delegateIdentityIdValue: string, page: number, pageSize: number): Promise<SearchResult<IRelationship>> {
        return new Promise<SearchResult<IRelationship>>(async(resolve, reject) => {
            const thePageSize: number = pageSize ? Math.min(pageSize, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
            try {
                const query = await (new Query()
                    .when(subjectIdentityIdValue, 'subject', () => PartyModel.findByIdentityIdValue(subjectIdentityIdValue))
                    .when(delegateIdentityIdValue, 'delegate', () => PartyModel.findByIdentityIdValue(delegateIdentityIdValue))
                    .build());
                const count = await RelationshipMongooseModel
                    .count(query)
                    .exec();
                const list = await RelationshipMongooseModel
                    .find(query)
                    .deepPopulate([
                        'relationshipType',
                        'subject',
                        'subjectNickName',
                        'delegate',
                        'delegateNickName',
                        'invitationIdentity.profile.name',
                        'invitationIdentity.profile.sharedSecrets',
                        'attributes.attributeName'
                    ])
                    .skip((page - 1) * thePageSize)
                    .limit(thePageSize)
                    .sort({name: 1})
                    .exec();
                resolve(new SearchResult<IRelationship>(page, count, thePageSize, list));
            } catch (e) {
                reject(e);
            }
        });
    }

    public static async searchByIdentity(identityIdValue: string,
                                  partyType: string,
                                  relationshipType: string,
                                  relationshipTypeCategory: string,
                                  profileProvider: string,
                                  status: string,
                                  inDateRange: boolean,
                                  text: string,
                                  sort: string,
                                  page: number,
                                  pageSize: number): Promise<SearchResult<IRelationship>> {
        return new Promise<SearchResult<IRelationship>>(async(resolve, reject) => {
            const thePageSize: number = pageSize ? Math.min(pageSize, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
            try {
                const party = await PartyModel.findByIdentityIdValue(identityIdValue);
                let mainAnd: {[key: string]: Object}[] = [];
                mainAnd.push({
                    '$or': [
                        {subject: party},
                        {delegate: party}
                    ]
                });
                if (partyType) {
                    mainAnd.push({
                        '$or': [
                            {'_delegatePartyTypeCode': partyType},
                            {'_subjectPartyTypeCode': partyType}
                        ]
                    });
                }
                if (relationshipType) {
                    mainAnd.push({'_relationshipTypeCode': relationshipType});
                }
                if (relationshipTypeCategory) {
                    mainAnd.push({'_relationshipTypeCategory': relationshipTypeCategory});
                }
                if (profileProvider) {
                    mainAnd.push({
                        '$or': [
                            {'_delegateProfileProviderCodes': profileProvider},
                            {'_subjectProfileProviderCodes': profileProvider}
                        ]
                    });
                }
                if (status) {
                    mainAnd.push({'status': status});
                }
                if (inDateRange) {
                    const date = new Date();
                    mainAnd.push({'startTimestamp': {$lte: date}});
                    mainAnd.push({'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]});
                }
                if (text) {
                    mainAnd.push({
                        '$or': [
                            {'_subjectNickNameString': new RegExp(text, 'i')},
                            {'_delegateNickNameString': new RegExp(text, 'i')},
                            {'_subjectABNString': new RegExp(text, 'i')},
                            {'_delegateABNString': new RegExp(text, 'i')}
                        ]
                    });
                }
                const where: {[key: string]: Object} = {};
                where['$and'] = mainAnd;
                const count = await RelationshipMongooseModel
                    .count(where)
                    .exec();
                const list = await RelationshipMongooseModel
                    .find(where)
                    .deepPopulate([
                        'relationshipType',
                        'subject',
                        'subjectNickName',
                        'delegate',
                        'delegateNickName',
                        'invitationIdentity.profile.name',
                        'invitationIdentity.profile.sharedSecrets',
                        'supersededBy',
                        'attributes.attributeName'
                    ])
                    .sort({
                        '_subjectNickNameString': !sort || sort === 'asc' ? 1 : -1,
                        '_delegateNickNameString': !sort || sort === 'asc' ? 1 : -1
                    })
                    .skip((page - 1) * thePageSize)
                    .limit(thePageSize)
                    .exec();
                resolve(new SearchResult<IRelationship>(page, count, thePageSize, list));
            } catch (e) {
                reject(e);
            }
        });
    }

    public static async searchByIdentitiesInDateRange(subjectIdValue: string,
                                               delegateIdValue: string,
                                               relationshipType: string,
                                               status: string,
                                               date: Date,
                                               page: number,
                                               pageSize: number): Promise<SearchResult<IRelationship>> {
        return new Promise<SearchResult<IRelationship>>(async(resolve, reject) => {
            const thePageSize: number = pageSize ? Math.min(pageSize, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
            try {
                const subject = await PartyModel.findByIdentityIdValue(subjectIdValue);
                const delegate = await PartyModel.findByIdentityIdValue(delegateIdValue);
                let mainAnd: {[key: string]: Object}[] = [];
                mainAnd.push({'subject': subject});
                mainAnd.push({'delegate': delegate});
                if (relationshipType) {
                    mainAnd.push({'_relationshipTypeCode': relationshipType});
                }
                if (status) {
                    mainAnd.push({'status': status});
                }
                const date = new Date();
                mainAnd.push({'startTimestamp': {$lte: date}});
                mainAnd.push({'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]});
                const where: {[key: string]: Object} = {};
                where['$and'] = mainAnd;
                const count = await RelationshipMongooseModel
                    .count(where)
                    .exec();
                const list = await RelationshipMongooseModel
                    .find(where)
                    .deepPopulate([
                        'relationshipType',
                        'subject',
                        'subjectNickName',
                        'delegate',
                        'delegateNickName',
                        'invitationIdentity.profile.name',
                        'invitationIdentity.profile.sharedSecrets',
                        'attributes.attributeName'
                    ])
                    .sort({
                        '_subjectNickNameString': 1,
                        '_delegateNickNameString': 1
                    })
                    .skip((page - 1) * thePageSize)
                    .limit(thePageSize)
                    .exec();
                resolve(new SearchResult<IRelationship>(page, count, thePageSize, list));
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Returns a paginated list of distinct subjects for relationships which have a delegate matching the one supplied.
     *
     * todo need to optional filters (authorisation management)
     */
    public static async searchDistinctSubjectsForMe(requestingParty: IParty, partyType: string, authorisationManagement: string, text: string, sort: string, page: number, pageSize: number): Promise<SearchResult<IParty>> {
        return new Promise<SearchResult<IParty>>(async(resolve, reject) => {
            const thePageSize: number = pageSize ? Math.min(pageSize, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
            try {
                const where: {[key: string]: Object} = {
                    '$match': {
                        '$and': [{'delegate': new mongoose.Types.ObjectId(requestingParty.id)}]
                    }
                };
                if (partyType) {
                    where['$match']['$and'].push({'_subjectPartyTypeCode': partyType});
                }
                // todo authorisation management
                if (text) {
                    where['$match']['$and'].push({
                        '$or': [
                            {'_subjectNickNameString': new RegExp(text, 'i')},
                            {'_subjectABNString': new RegExp(text, 'i')},
                        ]
                    });
                }
                const count = (await RelationshipMongooseModel
                    .aggregate([
                        where,
                        {'$group': {'_id': '$subject'}}
                    ])
                    .exec()).length;
                const listOfIds = await RelationshipMongooseModel
                    .aggregate([
                        where,
                        {'$group': {'_id': '$subject'}}
                    ])
                    .sort({
                        '_subjectNickNameString': !sort || sort === 'asc' ? 1 : -1
                    })
                    .skip((page - 1) * thePageSize)
                    .limit(thePageSize)
                    .exec();
                let wrappedPartyList: IParty[] = await PartyModel.populate(listOfIds, {path: '_id'});
                const unwrappedPartyList = wrappedPartyList.map((item: {_id: IParty}) => item._id);
                resolve(new SearchResult<IParty>(page, count, thePageSize, unwrappedPartyList));
            } catch (e) {
                reject(e);
            }
        });
    }

    public static async mergeAttributes(relationshipType: IRelationshipType, attributes: IRelationshipAttribute[], dtoAttributes: RelationshipAttributeDTO[]): Promise<IRelationshipAttribute[]> {
        const permissionCustomisationAllowed = relationshipType.findAttributeNameUsage('PERMISSION_CUSTOMISATION_ALLOWED_IND');
        let isPermissionAttributeAllowed = permissionCustomisationAllowed !== null;

        // iterate thru dto attributes and update or add attributes as needed
        for (let dtoAttribute of dtoAttributes) {

            // attribute value
            const dtoAttributeValue = dtoAttribute.value;

            // get and validate relationship attribute
            if (!dtoAttribute.attributeName || !dtoAttribute.attributeName.href) {
                throw new Error('400:Relationship attribute invalid');
            }
            const relationshipAttributeNameUsage = relationshipType.findAttributeNameUsage(Url.lastPathElement(dtoAttribute.attributeName.href));
            if (!relationshipAttributeNameUsage) {
                throw new Error('400:Relationship attribute not associated with relationship type');
            }

            // classifier flags
            const isPermissionClassifier = relationshipAttributeNameUsage.attributeName.classifier === RelationshipAttributeNameClassifier.Permission.code;
            const isOtherClassifier = relationshipAttributeNameUsage.attributeName.classifier === RelationshipAttributeNameClassifier.Other.code;
            const isAgencyServiceClassifier = relationshipAttributeNameUsage.attributeName.classifier === RelationshipAttributeNameClassifier.AgencyService.code;

            // check
            if (!relationshipAttributeNameUsage.attributeName.appliesToInstance) {
                throw new Error(`400:Relationship attribute name ${relationshipAttributeNameUsage.attributeName.code} does not apply to instance`);
            }

            // update or add attribute
            if (isPermissionClassifier) {
                if (isPermissionAttributeAllowed) {
                    await RelationshipModel.updateOrAddAttribute(attributes, relationshipAttributeNameUsage.attributeName, dtoAttributeValue);
                } else {
                    throw new Error('400:Relationship permission attribute not allowed');
                }
            } else if (isOtherClassifier || isAgencyServiceClassifier) {
                await RelationshipModel.updateOrAddAttribute(attributes, relationshipAttributeNameUsage.attributeName, dtoAttributeValue);
            }
        }

        return attributes;
    }

    private static async createInvitationIdentityIfRequired(dto: DTO): Promise<IIdentity> {
        let invitationIdentity: IIdentity;

        const isSubjectCreatingRelationshipInvitation =
            dto.initiatedBy === RelationshipInitiatedBy.Subject.code
            && dto.delegate.value
            && dto.delegate.value.partyType === PartyType.Individual.code
            && dto.delegate.value.identities.length === 1
            && dto.delegate.value.identities[0].value
            && dto.delegate.value.identities[0].value.identityType === IdentityType.InvitationCode.code
            && dto.delegate.value.identities[0].value.profile.provider === ProfileProvider.Invitation.code;

        if (isSubjectCreatingRelationshipInvitation) {
            const hasSharedSecretValue = dto.delegate.value.identities[0].value.profile.sharedSecrets
                && dto.delegate.value.identities[0].value.profile.sharedSecrets.length === 1
                && dto.delegate.value.identities[0].value.profile.sharedSecrets[0].value;

            invitationIdentity = await IdentityModel.createInvitationCodeIdentity(
                dto.delegate.value.identities[0].value.profile.name.givenName,
                dto.delegate.value.identities[0].value.profile.name.familyName,
                hasSharedSecretValue ? dto.delegate.value.identities[0].value.profile.sharedSecrets[0].value : null
            );
        }

        return invitationIdentity;
    }

}

// concrete model .....................................................................................................

RelationshipMongooseModel = Model(
    'Relationship',
    RelationshipSchema,
    Relationship
) as mongoose.Model<IRelationshipDocument>;
