import * as mongoose from 'mongoose';
import {RAMEnum, RAMSchema, IRAMObject, RAMObject, Model, removeFromArray} from './base';
import {Url} from './url';
import {IParty, PartyModel} from './party.model';
import {IRoleType} from './roleType.model';
import {IRoleAttribute, RoleAttributeModel} from './roleAttribute.model';
import {RoleAttributeNameModel, RoleAttributeNameClassifier} from './roleAttributeName.model';
import {
    HrefValue,
    Role as DTO,
    RoleStatus as RoleStatusDTO,
    RoleAttribute as RoleAttributeDTO,
    SearchResult
} from '../../../commons/api';
import {logger} from '../logger';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {Permissions} from '../../../commons/dtos/permission.dto';

const MAX_PAGE_SIZE = 10;

// mongoose ...........................................................................................................

let RoleMongooseModel: mongoose.Model<IRoleDocument>;

// enums, utilities, helpers ..........................................................................................

export class RoleStatus extends RAMEnum {

    public static Active = new RoleStatus('ACTIVE', 'Active');
    public static Suspended = new RoleStatus('SUSPENDED', 'Suspended');
    public static Removed = new RoleStatus('REMOVED', 'Removed');

    protected static AllValues = [
        RoleStatus.Active,
        RoleStatus.Suspended,
        RoleStatus.Removed
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<RoleStatusDTO>> {
        return Promise.resolve(new HrefValue(
            await Url.forRoleStatus(this),
            includeValue ? this.toDTO() : undefined
        ));
    }

    public toDTO(): RoleStatusDTO {
        return new RoleStatusDTO(this.code, this.shortDecodeText);
    }
}

// schema .............................................................................................................

const RoleSchema = RAMSchema({
    roleType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoleType',
        required: [true, 'Role Type is required']
    },
    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: [true, 'Party is required']
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
        enum: RoleStatus.valueStrings()
    },
    attributes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoleAttribute'
    }],
    _roleTypeCode: {
        type: String,
        required: [true, 'Role Type Code is required'],
        trim: true
    }
});

RoleSchema.pre('validate', function (next: () => void) {
    if (this.roleType) {
        this._roleTypeCode = this.roleType.code;
    }
    let hasAgencyServiceWhichIsNotEndDated = false;

    for (let attribute of this.attributes) {
        if (attribute.attributeName.classifier === 'AGENCY_SERVICE' &&
            attribute.value &&
            attribute.value.length > 0 &&
            attribute.value[0] === 'true' &&
            attribute.attributeName.isInDateRange()) {
            hasAgencyServiceWhichIsNotEndDated = true;
            break;
        }
    }

    // can only change status if the current status is NOT suspended
    if (this.status !== RoleStatus.Suspended.code) {
        if (!hasAgencyServiceWhichIsNotEndDated) {
            // no active agency services
            this.status = RoleStatus.Removed.code;
        } else {
            // at least one active agency service
            this.status = RoleStatus.Active.code;
        }
    }

    next();
});

// instance ...........................................................................................................

export interface IRole extends IRAMObject {
    roleType: IRoleType;
    party: IParty;
    startTimestamp: Date;
    endTimestamp?: Date;
    endEventTimestamp?: Date;
    status: string;
    attributes: IRoleAttribute[];
    _roleTypeCode: string;

    statusEnum(): RoleStatus;
    updateOrCreateAttribute(roleAttributeNameCode: string, value: string): Promise<IRoleAttribute>;
    saveAttributes(): Promise<IRole>;
    findAttribute(roleAttributeNameCode: string, roleAttributeNameClassifier?: string): IRoleAttribute;
    deleteAttribute(roleAttributeNameCode: string, roleAttributeNameClassifier: string): Promise<IRole>;
    getAgencyServiceAttributesInDateRange(date: Date): IRoleAttribute[];
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
}

class Role extends RAMObject implements IRole {
    public roleType: IRoleType;
    public party: IParty;
    public startTimestamp: Date;
    public endTimestamp: Date;
    public endEventTimestamp: Date;
    public status: string;
    public attributes: IRoleAttribute[];
    public _roleTypeCode: string;

    public statusEnum(): RoleStatus {
        return RoleStatus.valueOf(this.status) as RoleStatus;
    }

    public async updateOrCreateAttribute(roleAttributeNameCode: string, value: string): Promise<IRoleAttribute> {

        // todo if attributeName is not inflated and was an object id, should we inflate it?

        console.log('role before =', JSON.stringify(this, null, 4));
        console.log('roleAttributeNameCode=', roleAttributeNameCode);
        console.log('value=', value);

        for (let attribute of this.attributes) {
            console.log('attribute=', JSON.stringify(attribute, null, 4));
            if (attribute.attributeName.code === roleAttributeNameCode) {
                attribute.value = [value];
                await attribute.save();
                return Promise.resolve(attribute);
            }
        }

        const roleAttributeName = await RoleAttributeNameModel.findByCodeIgnoringDateRange(roleAttributeNameCode);
        if (roleAttributeName) {
            const roleAttribute = await RoleAttributeModel.create({
                value: value,
                attributeName: roleAttributeName
            });
            this.attributes.push(roleAttribute);
            console.log('role after attribute create=', JSON.stringify(this, null, 4));
            return Promise.resolve(roleAttribute);
        } else {
            logger.error(`Could not find roleAttributeName ${roleAttributeNameCode}`);
        }
    }

    public async saveAttributes(): Promise<IRole> {
        return this.save();
    }

    public findAttribute(roleAttributeNameCode: string, roleAttributeNameClassifier?: string): IRoleAttribute {
        for (let attribute of this.attributes) {
            if (attribute.attributeName.code === roleAttributeNameCode &&
                (!roleAttributeNameClassifier || attribute.attributeName.classifier === roleAttributeNameClassifier)) {
                return attribute;
            }
        }
    }

    public async deleteAttribute(roleAttributeNameCode: string, roleAttributeNameClassifier: string): Promise<IRole> {
        this.attributes.forEach((attribute: IRoleAttribute) => {
            if (attribute.attributeName.classifier === roleAttributeNameClassifier && attribute.attributeName.code === roleAttributeNameCode) {
                removeFromArray(this.attributes, {_id: attribute.id});
                this.save();
                attribute.delete();
            }
        });
        return this.save();
    }

    public getAgencyServiceAttributesInDateRange(date: Date): IRoleAttribute[] {
        date.setHours(0, 0, 0, 0);
        let agencyServiceAttributes: IRoleAttribute[] = [];
        this.attributes.forEach((attribute: IRoleAttribute) => {
            const attributeName = attribute.attributeName;
            if (attributeName.classifier === RoleAttributeNameClassifier.AgencyService.code) {
                if (attributeName.startDate <= date && (attributeName.endDate === null || attributeName.endDate === undefined || attributeName.endDate >= date)) {
                    agencyServiceAttributes.push(attribute);
                }
            }
        });
        return agencyServiceAttributes;
    }

    public async getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.role, PermissionEnforcers.role);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forRole(this),
            includeValue ? await this.toDTO() : undefined
        );
    }

    public async toDTO(): Promise<DTO> {
        return new DTO(
            Url.links()
                .push('self', Url.GET, await Url.forRole(this))
                .push('modify', Url.PUT, await Url.forRole(this))
                .toArray(),
            this._id.toString() /*todo what code should we use?*/,
            await this.roleType.toHrefValue(false),
            await this.party.toHrefValue(true),
            this.startTimestamp,
            this.endTimestamp,
            this.endEventTimestamp,
            this.createdAt,
            this.status,
            await Promise.all<RoleAttributeDTO>(this.attributes.map(
                async(attribute: IRoleAttribute) => {
                    return await attribute.toDTO();
                }))
        );
    }
}

interface IRoleDocument extends IRole, mongoose.Document {
}

// static .............................................................................................................

export class RoleModel {

    public static async create(source: any): Promise<IRole> {
        return RoleMongooseModel.create(source);
    }

    public static async add(roleType: IRoleType,
                            party: IParty,
                            startTimestamp: Date,
                            endTimestamp: Date,
                            roleStatus: RoleStatus,
                            attributes: IRoleAttribute[]): Promise<IRole> {
        return await RoleMongooseModel.create({
            roleType: roleType,
            party: party,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            status: roleStatus.code,
            attributes: attributes
        });
    }

    public static async findByIdentifier(id: string): Promise<IRole> {
        // TODO migrate from _id to another id
        return RoleMongooseModel
            .findOne({
                _id: id
            })
            .deepPopulate([
                'roleType',
                'party',
                'attributes.attributeName'
            ])
            .exec();
    }

    public static async findByRoleTypeAndParty(roleType: IRoleType, party: IParty): Promise<IRole> {
        return RoleMongooseModel
            .findOne({
                roleType: roleType,
                party: party
            })
            .deepPopulate([
                'roleType',
                'party',
                'attributes.attributeName'
            ])
            .exec();
    }

    public static async searchByIdentity(identityIdValue: string,
                                   roleType: string,
                                   status: string,
                                   inDateRange: boolean,
                                   page: number,
                                   reqPageSize: number): Promise<SearchResult<IRole>> {
        return new Promise<SearchResult<IRole>>(async(resolve, reject) => {
            const pageSize: number = reqPageSize ? Math.min(reqPageSize, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
            try {
                const party = await PartyModel.findByIdentityIdValue(identityIdValue);
                let mainAnd: {[key: string]: Object}[] = [];
                mainAnd.push({
                    party: party
                });
                if (roleType) {
                    mainAnd.push({'_roleTypeCode': roleType});
                }
                if (status) {
                    mainAnd.push({'status': status});
                }
                if (inDateRange) {
                    const date = new Date();
                    mainAnd.push({'startTimestamp': {$lte: date}});
                    mainAnd.push({'$or': [{endTimestamp: null}, {endTimestamp: {$gte: date}}]});
                }
                const where: {[key: string]: Object} = {};
                where['$and'] = mainAnd;
                const count = await RoleMongooseModel
                    .count(where)
                    .exec();
                const list = await RoleMongooseModel
                    .find(where)
                    .deepPopulate([
                        'roleType',
                        'party',
                        'attributes.attributeName'
                    ])
                    .skip((page - 1) * pageSize)
                    .limit(pageSize)
                    .exec();
                resolve(new SearchResult<IRole>(page, count, pageSize, list));
            } catch (e) {
                reject(e);
            }
        });
    }

    public static async findActiveByIdentityInDateRange(identityIdValue: string,
                                                        roleType: string,
                                                        date: Date): Promise<IRole> {
        const party = await PartyModel.findByIdentityIdValue(identityIdValue);
        return RoleMongooseModel
            .findOne({
                party: party,
                status: RoleStatus.Active.code,
                startTimestamp: {$lte: date},
                $or: [{endTimestamp: null}, {endTimestamp: {$gte: date}}]
            })
            .deepPopulate([
                'roleType',
                'party',
                'attributes.attributeName'
            ])
            .exec();
    }

}

// concrete model .....................................................................................................

RoleMongooseModel = Model(
    'Role',
    RoleSchema,
    Role
) as mongoose.Model<IRoleDocument>;
