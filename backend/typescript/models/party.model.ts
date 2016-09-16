import * as mongoose from 'mongoose';
import {RAMEnum, RAMSchema, Assert, IRAMObject, RAMObject, Model} from './base';
import {Url} from './url';
import {IIdentity, IdentityModel} from './identity.model';
import {RelationshipModel, IRelationship, RelationshipInitiatedBy} from './relationship.model';
import {RelationshipTypeModel} from './relationshipType.model';
import {RelationshipAttributeModel, IRelationshipAttribute} from './relationshipAttribute.model';
import {RelationshipAttributeNameModel} from './relationshipAttributeName.model';
import {RoleTypeModel} from './roleType.model';
import {IRole, RoleModel, RoleStatus} from './role.model';
import {IRoleAttribute, RoleAttributeModel} from './roleAttribute.model';
import {IAgencyUser} from './agencyUser.model';
import {RoleAttributeNameModel, IRoleAttributeName} from './roleAttributeName.model';
import {IPrincipal} from './principal.model';
import {
    HrefValue,
    Party as DTO,
    PartyType as PartyTypeDTO,
    Identity as IdentityDTO,
    IInvitationCodeRelationshipAddDTO,
    IRole as RoleDTO,
    IRelationship as IRelationshipDTO
} from '../../../commons/api';
import {context} from '../providers/context.provider';
import {logger} from '../logger';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _RoleAttributeModel = RoleAttributeModel;
const _RelationshipTypeModel = RelationshipTypeModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let PartyMongooseModel: mongoose.Model<IPartyDocument>;

// enums, utilities, helpers ..........................................................................................

export class PartyType extends RAMEnum {

    public static ABN = new PartyType('ABN', 'ABN');
    public static Individual = new PartyType('INDIVIDUAL', 'Individual');

    protected static AllValues = [
        PartyType.ABN,
        PartyType.Individual,
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<PartyTypeDTO>> {
        return Promise.resolve(new HrefValue<PartyTypeDTO>(
            await Url.forPartyType(this),
            includeValue ? this.toDTO() : undefined
        ));
    }

    public toDTO(): PartyTypeDTO {
        return new PartyTypeDTO(this.code, this.shortDecodeText);
    }
}

// schema .............................................................................................................

const PartySchema = RAMSchema({
    partyType: {
        type: String,
        required: [true, 'Party Type is required'],
        trim: true,
        enum: PartyType.valueStrings()
    }
});

// instance ...........................................................................................................

export interface IParty extends IRAMObject {
    partyType: string;
    partyTypeEnum(): PartyType;
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
    addRelationship(dto: IInvitationCodeRelationshipAddDTO): Promise<IRelationship>;
    addRelationship2(relationshipDTO: IRelationshipDTO): Promise<IRelationship>;
    addOrModifyRole(role: RoleDTO, agencyUser: IAgencyUser): Promise<IRole>;
    modifyRole(role: RoleDTO): Promise<IRole>;
    findDefaultIdentity(): Promise<IIdentity>;
}

class Party extends RAMObject implements IParty {

    public partyType: string;

    public partyTypeEnum(): PartyType {
        return PartyType.valueOf(this.partyType) as PartyType;
    }

    public async getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.party, PermissionEnforcers.party);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forParty(this),
            includeValue ? await this.toDTO() : undefined
        );
    }

    public async toDTO(): Promise<DTO> {
        const identities = await IdentityModel.listByPartyId(this._id);
        return new DTO(
            Url.links()
                .push('self', Url.GET, await Url.forParty(this))
                .toArray(),
            this.partyType,
            await Promise.all<HrefValue<IdentityDTO>>(identities.map(
                async(identity: IIdentity) => {
                    return await identity.toHrefValue(true);
                }))
        );
    }

    /**
     * Creates a relationship to a temporary identity (InvitationCode) until the invitation has been accepted, whereby
     * the relationship will be transferred to the authorised identity.
     *
     */
    /* tslint:disable:max-func-body-length */
    // TODO delete this method and use a more generic addRelationship2 which will either create an invitation code OR use provided subject and delegate
    public async addRelationship(dto: IInvitationCodeRelationshipAddDTO): Promise<IRelationship> {

        // TODO improve handling of lookups that return null outside of the date range

        // lookups
        const relationshipType = await RelationshipTypeModel.findByCodeInDateRange(dto.relationshipType, new Date());
        const subjectIdentity = await IdentityModel.findByIdValue(dto.subjectIdValue);

        // create the temp identity for the invitation code
        const temporaryDelegateIdentity = await IdentityModel.createInvitationCodeIdentity(
            dto.delegate.givenName,
            dto.delegate.familyName,
            dto.delegate.sharedSecretValue
        );

        const attributes: IRelationshipAttribute[] = [];
        for (let attr of dto.attributes) {
            const attributeName = await RelationshipAttributeNameModel.findByCodeInDateRange(attr.code, new Date());
            if (attributeName) {
                attributes.push(await RelationshipAttributeModel.create({
                    value: attr.value,
                    attributeName: attributeName
                }));
            }
        }

        return await RelationshipModel.add(
            relationshipType,
            subjectIdentity.party,
            subjectIdentity.profile.name,
            temporaryDelegateIdentity.party,
            temporaryDelegateIdentity.profile.name,
            dto.startTimestamp,
            dto.endTimestamp,
            RelationshipInitiatedBy.Subject,
            temporaryDelegateIdentity,
            attributes
        );
    }

    public async addRelationship2(dto: IRelationshipDTO): Promise<IRelationship> {

        const relationshipTypeCode = Url.lastPathElement(dto.relationshipType.href);
        Assert.assertNotNull(relationshipTypeCode, 'Relationship type code in resource reference not found');

        const relationshipType = await RelationshipTypeModel.findByCodeInDateRange(relationshipTypeCode, new Date());
        Assert.assertNotNull(relationshipType, 'Relationship type not found');

        const delegateIdValue = Url.lastPathElement(dto.delegate.href);
        Assert.assertNotNull(delegateIdValue, 'Delegate id value in resource reference not found');

        const delegateIdentity = await IdentityModel.findByIdValue(delegateIdValue);
        Assert.assertNotNull(delegateIdentity, 'Delegate identity not found');

        const subjectIdentity = await IdentityModel.findDefaultByPartyId(this._id);
        Assert.assertNotNull(subjectIdentity, 'Subject identity not found');

        const attributes: IRelationshipAttribute[] = [];
        for (let attr of dto.attributes) {
            const attributeName = await RelationshipAttributeNameModel.findByCodeInDateRange(attr.attributeName.value.code, new Date());
            if (attributeName) {
                attributes.push(await RelationshipAttributeModel.create({
                    value: attr.value,
                    attributeName: attributeName
                }));
            }
        }

        return RelationshipModel.add(
            relationshipType,
            this,
            subjectIdentity.profile.name,
            delegateIdentity.party,
            delegateIdentity.profile.name,
            dto.startTimestamp,
            dto.endTimestamp,
            RelationshipInitiatedBy.valueOf(dto.initiatedBy),
            null,
            attributes
        );

    }

    public async addOrModifyRole(roleDTO: RoleDTO, agencyUser: IAgencyUser): Promise<IRole> {

        const now = new Date();
        const roleTypeCode = roleDTO.roleType.value.code;
        const roleType = await
            RoleTypeModel.findByCodeInDateRange(roleTypeCode, now);
        Assert.assertTrue(roleType !== null, 'Role type invalid');

        let role: IRole = await
            RoleModel.findByRoleTypeAndParty(roleType, this);
        if (role === null) {
            role = await
                RoleModel.create({
                    roleType: roleType,
                    party: this,
                    startTimestamp: now,
                    status: RoleStatus.Active.code,
                    attributes: []
                });
        }

        const roleAttributes: IRoleAttribute[] = [];

        // add or update attribute
        let processAttribute = async(code: string, value: string[], roleAttributes: IRoleAttribute[], role: IRole) => {
            const roleAttributeName = await RoleAttributeNameModel.findByCodeIgnoringDateRange(code);
            if (roleAttributeName) {
                if (roleAttributeName.appliesToInstance) {
                    const filteredRoleAttributes: IRoleAttribute[] = role.attributes.filter((item) => {
                        return item.attributeName.code === code;
                    });
                    const roleAttributeDoesNotExist = filteredRoleAttributes.length === 0;
                    if (roleAttributeDoesNotExist) {
                        roleAttributes.push(await RoleAttributeModel.create({
                            value: value,
                            attributeName: roleAttributeName
                        }));
                    } else {
                        const filteredRoleAttribute = filteredRoleAttributes[0];
                        filteredRoleAttribute.value = value;
                        await filteredRoleAttribute.save();
                        roleAttributes.push(filteredRoleAttribute);
                    }
                } else {
                    logger.warn('Role attribute name does not apply to instance');
                    throw new Error('400');
                }
            }
        };

        await processAttribute('CREATOR_ID', [agencyUser.id], roleAttributes, role);
        await processAttribute('CREATOR_NAME', [agencyUser.displayName], roleAttributes, role);
        await processAttribute('CREATOR_AGENCY', [agencyUser.agency], roleAttributes, role);

        for (let roleAttribute of roleDTO.attributes) {
            const roleAttributeValue = roleAttribute.value;
            const roleAttributeNameCode = roleAttribute.attributeName.value.code;
            const roleAttributeNameCategory = roleAttribute.attributeName.value.category;

            let shouldSave = false;
            if (roleAttribute.attributeName.value.classifier === 'AGENCY_SERVICE') {
                for (let programRole of agencyUser.programRoles) {
                    if (programRole.role === 'ROLE_ADMIN' && programRole.program === roleAttributeNameCategory) {
                        shouldSave = true;
                        break;
                    }
                }
            } else {
                shouldSave = true;
            }

            if (shouldSave) {
                await processAttribute(roleAttributeNameCode, roleAttributeValue, roleAttributes, role);
            }
        }

        role.attributes = roleAttributes;

        role.saveAttributes();

        return Promise.resolve(role);

    }

    public async modifyRole(roleDTO: RoleDTO): Promise<IRole> {
        logger.info('about to modify role');
        const principal = context.getAuthenticatedPrincipal();

        const now = new Date();

        const roleTypeCode = Url.lastPathElement(roleDTO.roleType.href);
        Assert.assertNotNull(roleTypeCode, 'Role type code from href invalid');

        const roleType = await RoleTypeModel.findByCodeInDateRange(roleTypeCode, now);
        Assert.assertTrue(roleType !== null, 'Role type invalid');

        const role = await RoleModel.findByRoleTypeAndParty(roleType, this);
        Assert.assertNotNull(role, 'Party does not have role type');

        const roleAttributes = role.attributes;

        // todo move this into the role object
        let updateOrCreateRoleAttributeIfExists = async(roleAttributeName: IRoleAttributeName, value: string[], role: IRole) => {
            const existingAttribute = await role.findAttribute(roleAttributeName.code);
            if (!existingAttribute) {
                logger.debug(`Adding new RoleAttribute ${roleAttributeName.code}`);
                roleAttributes.push(await RoleAttributeModel.create({
                    value: value,
                    attributeName: roleAttributeName
                }));
            } else {
                logger.debug(`Updating existing RoleAttribute ${roleAttributeName.code}`);
                existingAttribute.value = value;
                await existingAttribute.save();
            }
        };

        if (principal.agencyUserInd) {
            await updateOrCreateRoleAttributeIfExists(await RoleAttributeNameModel.findByCodeIgnoringDateRange('CREATOR_ID'), [principal.agencyUser.id], role);
            await updateOrCreateRoleAttributeIfExists(await RoleAttributeNameModel.findByCodeIgnoringDateRange('CREATOR_NAME'), [principal.agencyUser.displayName], role);
            await updateOrCreateRoleAttributeIfExists(await RoleAttributeNameModel.findByCodeIgnoringDateRange('CREATOR_AGENCY'), [principal.agencyUser.agency], role);
        }

        for (let roleAttribute of roleDTO.attributes) {
            const roleAttributeValue = roleAttribute.value;
            const roleAttributeNameCode = roleAttribute.attributeName.value.code;

            const existingAttributeName = await RoleAttributeNameModel.findByCodeIgnoringDateRange(roleAttributeNameCode);

            if (existingAttributeName) {
                logger.debug(`Processing ${existingAttributeName.code}`);
                // add/update agency services that have been specified applying filtering by agency user role
                if (principal.agencyUser && existingAttributeName.classifier === 'AGENCY_SERVICE') {
                    logger.debug(`Processing agency service ${existingAttributeName.code}`);
                    if (principal.agencyUser.hasRoleForProgram('ROLE_ADMIN', existingAttributeName.category)) {
                        logger.debug(`Processing agency service for admin ${existingAttributeName.code}`);
                        await updateOrCreateRoleAttributeIfExists(existingAttributeName, roleAttributeValue, role);
                    }
                }

                // add/update non agency services attributes
                if (existingAttributeName.classifier !== 'AGENCY_SERVICE') {
                    await updateOrCreateRoleAttributeIfExists(existingAttributeName, roleAttributeValue, role);
                }

            }
        }

        // remove any agency services this user has access to but were not specified
        if (principal.agencyUserInd) {
            for (let attribute of role.attributes) {
                logger.debug(`testing attribute ${attribute.attributeName.code}`);
                // find services
                if (attribute.attributeName.classifier === 'AGENCY_SERVICE') {
                    logger.debug(`testing agency service ${attribute.attributeName.code}`);
                    // if this user has ROLE_ADMIN for this category
                    if (principal.agencyUser.hasRoleForProgram('ROLE_ADMIN', attribute.attributeName.category)) {
                        logger.debug(`has role admin ${attribute.attributeName.code}`);
                        // then IF this service was NOT supplied it must be deleted
                        let matchingAttributes = roleDTO.attributes.filter((val) => {
                            return val.attributeName.value.code === attribute.attributeName.code &&
                                val.attributeName.value.category === attribute.attributeName.category &&
                                val.attributeName.value.classifier === attribute.attributeName.classifier;
                        });

                        if (matchingAttributes.length === 0) {
                            logger.warn(`Delete ${attribute.attributeName.code}`);
                            await role.deleteAttribute(attribute.attributeName.code, 'AGENCY_SERVICE');
                        }
                    }
                }
            }
        }

        await role.saveAttributes();

        return Promise.resolve(role);
    }

    public async findDefaultIdentity(): Promise<IIdentity> {
        return IdentityModel.findDefaultByPartyId(this.id);
    }

}

interface IPartyDocument extends IParty, mongoose.Document {
}

// static .............................................................................................................

export class PartyModel {

    public static async create(source: any): Promise<IParty> {
        return PartyMongooseModel.create(source);
    }

    public static async findById(id: string): Promise<IParty> {
        return await PartyMongooseModel.findById(id);
    }

    public static async findByIdentityIdValue(idValue: string): Promise<IParty> {
        const identity = await IdentityModel.findByIdValue(idValue);
        return identity ? identity.party : null;
    }

    public static async hasAccess(requestedIdValue: string, requestingPrincipal: IPrincipal): Promise<boolean> {
        const requestedIdentity = await IdentityModel.findByIdValue(requestedIdValue);
        const requestingIdentity = requestingPrincipal ? requestingPrincipal.identity : null;
        if (requestedIdentity) {
            // requested party exists
            if (requestingPrincipal && requestingPrincipal.agencyUserInd) {
                // agency users have implicit global access
                return true;
            } else if (requestingIdentity) {
                // regular users have explicit access
                let requestingParty = requestingIdentity.party;
                const requestedParty = requestedIdentity.party;
                if (requestingParty.id === requestedParty.id) {
                    // requested and requester are the same
                    return true;
                } else {
                    // check 1st and 2nd level relationships
                    return await RelationshipModel.hasActiveInDateRange1stOr2ndLevelConnection(
                        requestingParty,
                        requestedIdValue,
                        new Date()
                    );
                }
            }
        }
        return false;
    }

    public static async computeConnectionStrength(requestedIdValue: string, requestingPrincipal: IPrincipal): Promise<number> {
        const maxStrength = Number.MAX_SAFE_INTEGER;
        const requestedIdentity = await IdentityModel.findByIdValue(requestedIdValue);
        const requestingIdentity = requestingPrincipal ? requestingPrincipal.identity : null;
        if (requestedIdentity) {
            // requested party exists
            if (requestingPrincipal && requestingPrincipal.agencyUserInd) {
                // agency users have implicit global access
                return maxStrength;
            } else if (requestingIdentity) {
                // regular users have explicit access
                let requestingParty = requestingIdentity.party;
                const requestedParty = requestedIdentity.party;
                if (requestingParty.id === requestedParty.id) {
                    // requested and requester are the same
                    return maxStrength;
                } else {
                    // check 1st and 2nd level relationships
                    return await RelationshipModel.computeConnectionStrength(
                        requestingParty,
                        requestedIdValue,
                        new Date()
                    );
                }
            }
        }
        return 0;
    }

    public static populate(listOfIds: Object[], options: {path: string}) {
        return PartyMongooseModel.populate(listOfIds, options);
    }

}

// concrete model .....................................................................................................

PartyMongooseModel = Model(
    'Party',
    PartySchema,
    Party
) as mongoose.Model<IPartyDocument>;
