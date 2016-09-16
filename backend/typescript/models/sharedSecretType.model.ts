import * as mongoose from 'mongoose';
import {CodeDecodeSchema, ICodeDecode, CodeDecode, Model} from './base';

// mongoose ...........................................................................................................

let SharedSecretTypeMongooseModel: mongoose.Model<ISharedSecretTypeDocument>;

// enums, utilities, helpers ..........................................................................................

export const DOB_SHARED_SECRET_TYPE_CODE = 'DATE_OF_BIRTH';

// schema .............................................................................................................

const SharedSecretTypeSchema = CodeDecodeSchema({
    domain: {
        type: String,
        required: [true, 'Domain is required'],
        trim: true
    }
});

// instance ...........................................................................................................

export interface ISharedSecretType extends ICodeDecode {
    domain: string;
}

class SharedSecretType extends CodeDecode implements ISharedSecretType {

    public domain: string;

}

// static .............................................................................................................

export class SharedSecretTypeModel {

    public static async create(source: any): Promise<ISharedSecretType> {
        return SharedSecretTypeMongooseModel.create(source);
    }

    public static async findByCodeIgnoringDateRange(code: string): Promise<ISharedSecretType> {
        return SharedSecretTypeMongooseModel
            .findOne({
                code: code
            })
            .exec();
    }

    public static async findByCodeInDateRange(code: string, date: Date): Promise<ISharedSecretType> {
        return SharedSecretTypeMongooseModel
            .findOne({
                code: code,
                startDate: {$lte: date},
                $or: [{endDate: null}, {endDate: {$gte: date}}]
            })
            .exec();
    }

    public static async listIgnoringDateRange(): Promise<ISharedSecretType[]> {
        return SharedSecretTypeMongooseModel
            .find({})
            .sort({name: 1})
            .exec();
    }

    public static async listInDateRange(date: Date): Promise<ISharedSecretType[]> {
        return SharedSecretTypeMongooseModel
            .find({
                startDate: {$lte: date},
                $or: [{endDate: null}, {endDate: {$gte: date}}]
            })
            .sort({name: 1})
            .exec();
    }

}

interface ISharedSecretTypeDocument extends ISharedSecretType, mongoose.Document {
}

// concrete model .....................................................................................................

SharedSecretTypeMongooseModel = Model(
    'SharedSecretType',
    SharedSecretTypeSchema,
    SharedSecretType
) as mongoose.Model<ISharedSecretTypeDocument>;
