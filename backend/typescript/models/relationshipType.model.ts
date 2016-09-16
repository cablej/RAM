import * as mongoose from 'mongoose';
import {RAMEnum, CodeDecodeSchema, ICodeDecode, CodeDecode, Model} from './base';
import {Url} from './url';
import {RelationshipAttributeNameModel} from './relationshipAttributeName.model';
import {
    IRelationshipAttributeNameUsage,
    RelationshipAttributeNameUsageModel
} from './relationshipAttributeNameUsage.model';
import {
    HrefValue,
    RelationshipType as DTO,
    RelationshipAttributeNameUsage as RelationshipAttributeNameUsageDTO
} from '../../../commons/api';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _RelationshipAttributeNameModel = RelationshipAttributeNameModel;
const _RelationshipAttributeNameUsageModel = RelationshipAttributeNameUsageModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let RelationshipTypeMongooseModel: mongoose.Model<IRelationshipTypeDocument>;

// enums, utilities, helpers ..........................................................................................

export class RelationshipTypeCategory extends RAMEnum {

    public static Authorisation = new RelationshipTypeCategory('AUTHORISATION', 'Authorisation');
    public static Notification = new RelationshipTypeCategory('NOTIFICATION', 'Notification');

    protected static AllValues = [
        RelationshipTypeCategory.Authorisation,
        RelationshipTypeCategory.Notification
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

// schema .............................................................................................................

const RelationshipTypeSchema = CodeDecodeSchema({
    minCredentialStrength: {
        type: Number,
        required: [true, 'Min Credential Strength is required'],
        default: 0
    },
    minIdentityStrength: {
        type: Number,
        required: [true, 'Min Identity Strength is required'],
        default: 0
    },
    strength: {
        type: Number,
        required: [true, 'Strength is required'],
        default: 0
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        enum: RelationshipTypeCategory.valueStrings()
    },
    attributeNameUsages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RelationshipAttributeNameUsage'
    }]
});

// interfaces .........................................................................................................

export interface IRelationshipType extends ICodeDecode {
    strength: number;
    minCredentialStrength: number;
    minIdentityStrength: number;
    category: string;
    attributeNameUsages: IRelationshipAttributeNameUsage[];
    categoryEnum(): RelationshipTypeCategory;
    findAttributeNameUsage(code: string): IRelationshipAttributeNameUsage;
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
}

class RelationshipType extends CodeDecode implements IRelationshipType {

    public strength: number;
    public minCredentialStrength: number;
    public minIdentityStrength: number;
    public category: string;
    public attributeNameUsages: IRelationshipAttributeNameUsage[];

    public categoryEnum(): RelationshipTypeCategory {
        return RelationshipTypeCategory.valueOf(this.category);
    }

    public findAttributeNameUsage(code: string): IRelationshipAttributeNameUsage {
        for (let attributeNameUsage of this.attributeNameUsages) {
            if (attributeNameUsage.attributeName.code === code) {
                return attributeNameUsage;
            }
        }
        return null;
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forRelationshipType(this),
            includeValue ? await this.toDTO() : undefined
        );
    }

    public async toDTO(): Promise<DTO> {
        return new DTO(
            this.code,
            this.shortDecodeText,
            this.longDecodeText,
            this.startDate,
            this.endDate,
            this.strength,
            this.minCredentialStrength,
            this.minIdentityStrength,
            this.category,
            await Promise.all<RelationshipAttributeNameUsageDTO>(this.attributeNameUsages.map(
                async(attributeNameUsage: IRelationshipAttributeNameUsage) => {
                    return new RelationshipAttributeNameUsageDTO(
                        attributeNameUsage.optionalInd,
                        attributeNameUsage.defaultValue,
                        await attributeNameUsage.attributeName.toHrefValue(true),
                        attributeNameUsage.sortOrder
                    );
                }))
        );
    }

}

interface IRelationshipTypeDocument extends IRelationshipType, mongoose.Document {
}

// static .............................................................................................................

export class RelationshipTypeModel {

    public static async create(source: any): Promise<IRelationshipType> {
        return RelationshipTypeMongooseModel.create(source);
    }

    public static async findByCodeIgnoringDateRange(code: String): Promise<IRelationshipType> {
        return RelationshipTypeMongooseModel
            .findOne({
                code: code
            })
            .deepPopulate([
                'attributeNameUsages.attributeName'
            ])
            .exec();
    }

    public static async findByCodeInDateRange(code: String, date: Date): Promise<IRelationshipType> {
        return RelationshipTypeMongooseModel
            .findOne({
                code: code,
                startDate: {$lte: date},
                $or: [{endDate: null}, {endDate: {$gte: date}}]
            })
            .deepPopulate([
                'attributeNameUsages.attributeName'
            ])
            .exec();
    }

    // todo change to search result with pagesize of 100 and add filters
    public static async listIgnoringDateRange(): Promise<IRelationshipType[]> {
        return RelationshipTypeMongooseModel
            .find({})
            .deepPopulate([
                'attributeNameUsages.attributeName'
            ])
            .sort({shortDecodeText: 1})
            .exec();
    }

    // todo change to search result with pagesize of 100 and add filters
    public static async listInDateRange(date: Date): Promise<IRelationshipType[]> {
        return RelationshipTypeMongooseModel
            .find({
                startDate: {$lte: date},
                $or: [{endDate: null}, {endDate: {$gte: date}}]
            })
            .deepPopulate([
                'attributeNameUsages.attributeName'
            ])
            .sort({shortDecodeText: 1})
            .exec();
    }

}

// concrete model .....................................................................................................

RelationshipTypeMongooseModel = Model(
    'RelationshipType',
    RelationshipTypeSchema,
    RelationshipType
) as mongoose.Model<IRelationshipTypeDocument>;
