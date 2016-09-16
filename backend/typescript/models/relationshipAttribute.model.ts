import * as mongoose from 'mongoose';
import {RelationshipModel} from './relationship.model';
import {IRelationshipAttributeName, RelationshipAttributeNameModel} from './relationshipAttributeName.model';
import {IRelationshipAttributeNameUsage} from './relationshipAttributeNameUsage.model';
import {IRelationshipAttribute as DTO} from '../../../commons/api';
import {IRAMObject, RAMObject, Model} from './base';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _RelationshipModel = RelationshipModel;
const _RelationshipAttributeNameModel = RelationshipAttributeNameModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let RelationshipAttributeMongooseModel: mongoose.Model<IRelationshipAttributeDocument>;

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const RelationshipAttributeSchema = new mongoose.Schema({
    value: {
        type: [String],
        required: false,
        trim: true
    },
    attributeName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RelationshipAttributeName',
        required: true
    }
});

// instance ...........................................................................................................

export interface IRelationshipAttribute extends IRAMObject {
    value?: string[];
    attributeName: IRelationshipAttributeName;
    toDTO(): Promise<DTO>;
}

export class RelationshipAttribute extends RAMObject implements IRelationshipAttribute {

    // needed for when appliesToInstance is flagged on attribute name and the attribute does not exist in the database
    constructor(public value: string[], public attributeName: IRelationshipAttributeName) {
        super(undefined, undefined, undefined, undefined, undefined);
    }

    public getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.relationshipAttribute, PermissionEnforcers.relationshipAttribute);
    }

    public async toDTO(): Promise<DTO> {
        const dto: DTO = {
            value: this.value,
            attributeName: await this.attributeName.toHrefValue(true)
        };

        return dto;
    }

}

interface IRelationshipAttributeDocument extends IRelationshipAttribute, mongoose.Document {
}

// static .............................................................................................................

export class RelationshipAttributeModel {

    public static async create(source: any): Promise<IRelationshipAttribute> {
        return await RelationshipAttributeMongooseModel.create(source);
    }

    // todo the default value from usage should be changed to string[] in the schema
    public static createInstance(source: IRelationshipAttributeNameUsage): Promise<IRelationshipAttribute> {
        return Promise.resolve(new RelationshipAttribute(source.defaultValue ? [source.defaultValue] : [], source.attributeName));
    }

    public static async add(value: string[], attributeName: IRelationshipAttributeName): Promise<IRelationshipAttribute> {
        return await RelationshipAttributeMongooseModel.create({
            value: value,
            attributeName: attributeName
        });
    }

}

// concrete model .....................................................................................................

RelationshipAttributeMongooseModel = Model(
    'RelationshipAttribute',
    RelationshipAttributeSchema,
    RelationshipAttribute
) as mongoose.Model<IRelationshipAttributeDocument>;
