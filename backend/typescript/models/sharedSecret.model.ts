import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import {RAMSchema, IRAMObject, RAMObject, Model} from './base';
import {ISharedSecretType, SharedSecretTypeModel} from './sharedSecretType.model';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// force schema to load first (see https://github.com/atogov/RAM/pull/220#discussion_r65115456)
/* tslint:disable:no-unused-variable */
const _SharedSecretTypeModel = SharedSecretTypeModel;
/* tslint:enable:no-unused-variable */

// mongoose ...........................................................................................................

let SharedSecretMongooseModel: mongoose.Model<ISharedSecretDocument>;

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const SharedSecretSchema = RAMSchema({
    value: {
        type: String,
        required: [true, 'Value is required'],
        set: (value: String) => {
            if (value) {
                const salt = bcrypt.genSaltSync(10);
                return bcrypt.hashSync(value, salt);
            }
            return value;
        }
    },
    sharedSecretType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedSecretType',
        required: [true, 'Shared Secret Type is required']
    }
});

// instance ...........................................................................................................

export interface ISharedSecret extends IRAMObject {
    value: string;
    sharedSecretType: ISharedSecretType;
    matchesValue(candidateValue: string): boolean;
}

class SharedSecret extends RAMObject implements ISharedSecret {

    public value: string;
    public sharedSecretType: ISharedSecretType;

    public async getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.sharedSecret, PermissionEnforcers.sharedSecret);
    }

    public matchesValue(candidateValue: string): boolean {
        if (candidateValue && this.value) {
            return bcrypt.compareSync(candidateValue, this.value);
        }
        return false;
    }

}

interface ISharedSecretDocument extends ISharedSecret, mongoose.Document {
}

// static .............................................................................................................

export class SharedSecretModel {

    public static async create(source: any): Promise<ISharedSecret> {
        return SharedSecretMongooseModel.create(source);
    }

}

// concrete model .....................................................................................................

SharedSecretMongooseModel = Model(
    'SharedSecret',
    SharedSecretSchema,
    SharedSecret
) as mongoose.Model<ISharedSecretDocument>;
