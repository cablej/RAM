import * as mongoose from 'mongoose';
import {RAMEnum, CodeDecodeSchema, ICodeDecode, CodeDecode, Model} from './base';
import {Url} from './url';
import {HrefValue, RelationshipAttributeName as DTO} from '../../../commons/api';

// mongoose ...........................................................................................................

let RelationshipAttributeNameMongooseModel: mongoose.Model<IRelationshipAttributeNameDocument>;

// enums, utilities, helpers ..........................................................................................

// see https://github.com/atogov/RAM/wiki/Relationship-Attribute-Types
export class RelationshipAttributeNameDomain extends RAMEnum {

    public static Null = new RelationshipAttributeNameDomain('NULL', 'NULL');
    public static Boolean = new RelationshipAttributeNameDomain('BOOLEAN', 'BOOLEAN');
    public static Number = new RelationshipAttributeNameDomain('NUMBER', 'NUMBER');
    public static String = new RelationshipAttributeNameDomain('STRING', 'STRING');
    public static Date = new RelationshipAttributeNameDomain('DATE', 'DATE');
    public static Markdown = new RelationshipAttributeNameDomain('MARKDOWN', 'MARKDOWN');
    public static SelectSingle = new RelationshipAttributeNameDomain('SELECT_SINGLE', 'SELECT_SINGLE');
    public static SelectMulti = new RelationshipAttributeNameDomain('SELECT_MULTI', 'SELECT_MULTI');

    protected static AllValues = [
        RelationshipAttributeNameDomain.Null,
        RelationshipAttributeNameDomain.Boolean,
        RelationshipAttributeNameDomain.Number,
        RelationshipAttributeNameDomain.String,
        RelationshipAttributeNameDomain.Date,
        RelationshipAttributeNameDomain.Markdown,
        RelationshipAttributeNameDomain.SelectSingle,
        RelationshipAttributeNameDomain.SelectMulti
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

export class RelationshipAttributeNameClassifier extends RAMEnum {

    public static Other = new RelationshipAttributeNameClassifier('OTHER', 'Other');
    public static Permission = new RelationshipAttributeNameClassifier('PERMISSION', 'Permission');
    public static AgencyService = new RelationshipAttributeNameClassifier('AGENCY_SERVICE', 'Agency Service');

    protected static AllValues = [
        RelationshipAttributeNameClassifier.Other,
        RelationshipAttributeNameClassifier.Permission,
        RelationshipAttributeNameClassifier.AgencyService
    ];

    constructor(code: string, shortDecodeText: string) {
        super(code, shortDecodeText);
    }
}

// schema .............................................................................................................

const RelationshipAttributeNameSchema = CodeDecodeSchema({
    domain: {
        type: String,
        required: [true, 'Domain is required'],
        trim: true,
        enum: RelationshipAttributeNameDomain.valueStrings()
    },
    classifier: {
        type: String,
        required: [true, 'Classifier is required'],
        trim: true,
        enum: RelationshipAttributeNameClassifier.valueStrings()
    },
    category: {
        type: String,
        trim: true
    },
    purposeText: {
        type: String,
        required: [true, 'Purpose Text is required'],
        trim: true
    },
    permittedValues: [{
        type: String
    }],
    appliesToInstance: {
        type: Boolean,
        required: [true, 'Applies to Instance is required'],
    }
});

// instance ...........................................................................................................

export interface IRelationshipAttributeName extends ICodeDecode {
    domain: string;
    classifier: string;
    category?: string;
    purposeText: string;
    permittedValues: string[];
    appliesToInstance: boolean;
    domainEnum(): RelationshipAttributeNameDomain;
    isInDateRange(): boolean;
    toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>>;
    toDTO(): Promise<DTO>;
}

class RelationshipAttributeName extends CodeDecode implements IRelationshipAttributeName {

    public domain: string;
    public classifier: string;
    public category: string;
    public purposeText: string;
    public permittedValues: string[];
    public appliesToInstance: boolean;

    public domainEnum(): RelationshipAttributeNameDomain {
        return RelationshipAttributeNameDomain.valueOf(this.domain);
    }

    public isInDateRange(): boolean {
        const date = new Date();
        return this.startDate <= date && (this.endDate === null || this.endDate === undefined || this.endDate >= date);
    }

    public async toHrefValue(includeValue: boolean): Promise<HrefValue<DTO>> {
        return new HrefValue(
            await Url.forRelationshipAttributeName(this),
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
            this.shortDecodeText,
            this.domain,
            this.classifier,
            this.category,
            this.permittedValues,
            this.appliesToInstance
        );
    }

}

interface IRelationshipAttributeNameDocument extends IRelationshipAttributeName, mongoose.Document {
}

// static .............................................................................................................

export class RelationshipAttributeNameModel {

    public static async create(source: any): Promise<IRelationshipAttributeName> {
        return RelationshipAttributeNameMongooseModel.create(source);
    }

    public static async findByCodeIgnoringDateRange(code: string): Promise<IRelationshipAttributeName> {
        return RelationshipAttributeNameMongooseModel
            .findOne({
                code: code
            })
            .exec();
    }

    public static async findByCodeInDateRange(code: string, date: Date): Promise<IRelationshipAttributeName> {
        return RelationshipAttributeNameMongooseModel
            .findOne({
                code: code,
                startDate: {$lte: date},
                $or: [{endDate: null}, {endDate: {$gte: date}}]
            })
            .exec();
    }

    public static async listIgnoringDateRange(): Promise<IRelationshipAttributeName[]> {
        return RelationshipAttributeNameMongooseModel
            .find({})
            .sort({name: 1})
            .exec();
    }

    public static async listInDateRange(date: Date): Promise<IRelationshipAttributeName[]> {
        return RelationshipAttributeNameMongooseModel
            .find({
                startDate: {$lte: date},
                $or: [{endDate: null}, {endDate: {$gte: date}}]
            })
            .sort({name: 1})
            .exec();
    }

}

// concrete model .....................................................................................................

RelationshipAttributeNameMongooseModel = Model(
    'RelationshipAttributeName',
    RelationshipAttributeNameSchema,
    RelationshipAttributeName
) as mongoose.Model<IRelationshipAttributeNameDocument>;
