import * as mongoose from 'mongoose';
import {RAMSchema, IRAMObject, RAMObject, Model} from './base';
import {Name as DTO} from '../../../commons/api';
import {Permissions} from '../../../commons/dtos/permission.dto';
import {PermissionTemplates} from '../../../commons/permissions/allPermission.templates';
import {PermissionEnforcers} from '../permissions/allPermission.enforcers';

// mongoose ...........................................................................................................

let NameMongooseModel: mongoose.Model<INameDocument>;

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const NameSchema = RAMSchema({
    givenName: {
        type: String,
        trim: true,
        required: [function () {
            return this.familyName || !this.unstructuredName;
        }, 'Given Name or Unstructured Name is required']
    },
    familyName: {
        type: String,
        trim: true
    },
    unstructuredName: {
        type: String,
        trim: true,
        required: [function () {
            return !this.givenName && !this.familyName;
        }, 'Given Name or Unstructured Name is required']
    },
    _displayName: {
        type: String,
        trim: true,
        required: true
    }
});

NameSchema.pre('validate', function (next: () => void) {
    if ((this.givenName || this.familyName) && this.unstructuredName) {
        throw new Error('Given/Family Name and Unstructured Name cannot both be specified');
    } else {
        if (this.givenName) {
            this._displayName = this.givenName + (this.familyName ? ' ' + this.familyName : '');
        } else if (this.unstructuredName) {
            this._displayName = this.unstructuredName;
        }
        next();
    }
});

// instance ...........................................................................................................

export interface IName extends IRAMObject {
    givenName?: string;
    familyName?: string;
    unstructuredName?: string;
    _displayName?: string;
    toDTO(): Promise<DTO>;
}

class Name extends RAMObject implements IName {

    public givenName: string;
    public familyName: string;
    public unstructuredName: string;
    public _displayName: string;

    public getPermissions(): Promise<Permissions> {
        return this.enforcePermissions(PermissionTemplates.iname, PermissionEnforcers.iname);
    }

    public async toDTO(): Promise<DTO> {
        return new DTO(
            this.givenName,
            this.familyName,
            this.unstructuredName,
            this._displayName
        );
    }

}

interface INameDocument extends IName, mongoose.Document {
}

// static .............................................................................................................

export class NameModel {

    public static async create(source: any): Promise<IName> {
        return NameMongooseModel.create(source);
    }

}

// concrete model .....................................................................................................

NameMongooseModel = Model(
    'Name',
    NameSchema,
    Name
) as mongoose.Model<INameDocument>;
