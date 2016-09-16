import * as mongoose from 'mongoose';
import {ICodeDecode, CodeDecode, CodeDecodeSchema, Model} from './base';
import {Url} from './url';
import {RoleAttributeNameModel} from './roleAttributeName.model';
import {IRoleAttributeNameUsage, RoleAttributeNameUsageModel} from './roleAttributeNameUsage.model';
import {HrefValue, RoleType as DTO, RoleAttributeNameUsage as RoleAttributeNameUsageDTO} from '../../../commons/api';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _RoleAttributeNameModel = RoleAttributeNameModel;
const _RoleAttributeNameUsageModel = RoleAttributeNameUsageModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let RoleTypeMongooseModel: mongoose.Model<IRoleTypeDocument>;

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const RoleTypeSchema = CodeDecodeSchema({
    attributeNameUsages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoleAttributeNameUsage'
    }]
});

// instance ...........................................................................................................

export interface IRoleType extends ICodeDecode {
    id: string;
    attributeNameUsages: IRoleAttributeNameUsage[];
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
}

class RoleType extends CodeDecode implements IRoleType {

    public id: string;
    public attributeNameUsages: IRoleAttributeNameUsage[];

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forRoleType(this),
            includeValue ? await this.toDTO() : undefined
        );
    };

    public async toDTO() {
        return new DTO(
            this.code,
            this.shortDecodeText,
            this.longDecodeText,
            this.startDate,
            this.endDate,
            await Promise.all<RoleAttributeNameUsageDTO>(this.attributeNameUsages.map(
                async(attributeNameUsage: IRoleAttributeNameUsage) => {
                    return new RoleAttributeNameUsageDTO(
                        attributeNameUsage.optionalInd,
                        attributeNameUsage.defaultValue,
                        await attributeNameUsage.attributeName.toHrefValue(true)
                    );
                }))
        );
    };

}

interface IRoleTypeDocument extends IRoleType, mongoose.Document {
}

// static .............................................................................................................

export class RoleTypeModel {

    public static async create(source: any): Promise<IRoleType> {
        return RoleTypeMongooseModel.create(source);
    }

    public static async findByCodeIgnoringDateRange(code: String): Promise<IRoleType> {
        return RoleTypeMongooseModel
            .findOne({
                code: code
            })
            .deepPopulate([
                'attributeNameUsages.attributeName'
            ])
            .exec();
    }

    public static async findByCodeInDateRange(code: String, date: Date): Promise<IRoleType> {
        return RoleTypeMongooseModel
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

    public static async listIgnoringDateRange(): Promise<IRoleType[]> {
        return RoleTypeMongooseModel
            .find({})
            .deepPopulate([
                'attributeNameUsages.attributeName'
            ])
            .sort({shortDecodeText: 1})
            .exec();
    }

    public static async listInDateRange(date: Date): Promise<IRoleType[]> {
        return RoleTypeMongooseModel
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

RoleTypeMongooseModel = Model(
    'RoleType',
    RoleTypeSchema,
    RoleType
) as mongoose.Model<IRoleTypeDocument>;
