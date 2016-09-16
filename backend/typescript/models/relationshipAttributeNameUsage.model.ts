import * as mongoose from 'mongoose';
import {RAMSchema, IRAMObject, RAMObject, Model} from './base';
import {IRelationshipAttributeName, RelationshipAttributeNameModel} from './relationshipAttributeName.model';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _RelationshipAttributeNameModel = RelationshipAttributeNameModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let RelationshipAttributeNameUsageMongooseModel: mongoose.Model<IRelationshipAttributeNameUsageDocument>;

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const RelationshipAttributeNameUsageSchema = RAMSchema({
    optionalInd: {
        type: Boolean,
        default: false,
        required: [true, 'Optional Indicator is required']
    },
    defaultValue: {
        type: String,
        required: false,
        trim: true
    },
    attributeName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RelationshipAttributeName'
    },
    sortOrder: {
        type: Number,
        required: true
    }
});

// instance ...........................................................................................................

export interface IRelationshipAttributeNameUsage extends IRAMObject {
    optionalInd: boolean;
    defaultValue?: string;
    attributeName: IRelationshipAttributeName;
    sortOrder: number;
}

class RelationshipAttributeNameUsage extends RAMObject implements IRelationshipAttributeNameUsage {

    public optionalInd: boolean;
    public defaultValue: string;
    public attributeName: IRelationshipAttributeName;
    public sortOrder: number;

    public getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.relationshipAttributeNameUsage, PermissionEnforcers.relationshipAttributeNameUsage);
    }

}

interface IRelationshipAttributeNameUsageDocument extends IRelationshipAttributeNameUsage, mongoose.Document {
}

// static .............................................................................................................

export class RelationshipAttributeNameUsageModel {

    public static async create(source: any): Promise<IRelationshipAttributeNameUsage> {
        return RelationshipAttributeNameUsageMongooseModel.create(source);
    }

}

// concrete model .....................................................................................................

RelationshipAttributeNameUsageMongooseModel = Model(
    'RelationshipAttributeNameUsage',
    RelationshipAttributeNameUsageSchema,
    RelationshipAttributeNameUsage
) as mongoose.Model<IRelationshipAttributeNameUsageDocument>;
