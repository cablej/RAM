import * as mongoose from 'mongoose';
import {RAMSchema, Model, RAMObject, IRAMObject} from './base';
import {RoleModel} from './role.model';
import {IRoleAttributeName, RoleAttributeNameModel} from './roleAttributeName.model';
import {RoleAttribute as DTO} from '../../../commons/api';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _RoleModel = RoleModel;
const _RoleAttributeNameModel = RoleAttributeNameModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let RoleAttributeMongooseModel: mongoose.Model<IRoleAttributeDocument>;

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const RoleAttributeSchema = RAMSchema({
    value: {
        type: [String],
        required: false,
        trim: true
    },
    attributeName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoleAttributeName',
        required: true
    }
});

// instance ...........................................................................................................

export interface IRoleAttribute extends IRAMObject {
    value: string[];
    attributeName: IRoleAttributeName;
    toDTO(): Promise<DTO>;
    delete(callback?: (err: any) => void): Promise<void>;
}

class RoleAttribute extends RAMObject implements IRoleAttribute {
    public value: string[];
    public attributeName: IRoleAttributeName;

    public getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.roleAttribute, PermissionEnforcers.roleAttribute);
    }

    public async toDTO(): Promise<DTO> {
        return new DTO(
            this.value,
            await this.attributeName.toHrefValue(true)
        );
    }

    public delete(callback?: (err: any) => void): Promise<void> {
        return RoleAttributeMongooseModel.remove(this).exec();
    }

}

interface IRoleAttributeDocument extends IRoleAttribute, mongoose.Document {
}
// static .............................................................................................................

export class RoleAttributeModel {
    public static async create(source: any): Promise<IRoleAttribute> {
        return RoleAttributeMongooseModel.create(source);
    }

    public static async findById(id: string): Promise<IRoleAttribute> {
        return RoleAttributeMongooseModel
            .findOne({
                _id: id
            }).exec();
    }
}

// concrete model .....................................................................................................

RoleAttributeMongooseModel = Model(
    'RoleAttribute',
    RoleAttributeSchema,
    RoleAttribute
) as mongoose.Model<IRoleAttributeDocument>;
