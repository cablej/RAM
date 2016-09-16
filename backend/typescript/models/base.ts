import * as mongoose from 'mongoose';
import {logger} from '../logger';
import * as _ from 'lodash';
import {IPermission, Permissions} from '../../../commons/dtos/permission.dto';

/* tslint:disable:no-var-requires */
const mongooseUniqueValidator = require('mongoose-unique-validator');
const mongooseIdValidator = require('mongoose-id-validator');
const mongooseDeepPopulate = require('mongoose-deep-populate')(mongoose);

// RAMEnum ............................................................................................................

/**
 * RAMEnum is a simple class construct that represents an enumerated type so we can work with classes not strings
 * as with traditional languages.
 */
export class RAMEnum {

    protected static AllValues: RAMEnum[];

    public static values<T extends RAMEnum>(): T[] {
        return this.AllValues as T[];
    }

    public static valueStrings<T extends RAMEnum>(): string[] {
        return this.AllValues.map((value: T) => value.code);
    }

    public static valueOf<T extends RAMEnum>(code: string): T {
        for (let type of this.AllValues) {
            if ((type as T).code === code) {
                return type as T;
            }
        }
        return null;
    }

    constructor(public code: string,
                public shortDecodeText: string) {
    }

}

// RAMObject ..........................................................................................................

//noinspection ReservedWordAsName

/**
 * IRAMObject defines the common attributes that all transactional documents in RAM will contain. Alongside,
 * ICodeDecode, these two interfaces define all the models in the system.
 */
export interface IRAMObject {
    _id: any;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deleteInd: boolean;
    resourceVersion: string;
    save(fn?: (err: any, product: this, numAffected: number) => void): Promise<this>;
    delete(): void;
    enforcePermissions(templates: Permissions, enforcers: IPermissionEnforcer<any>[]): Promise<Permissions>;
    getPermissions(): Promise<Permissions>;
}

// exists for type safety only, do not add function implementations here
export abstract class RAMObject implements IRAMObject {

    public id: string;

    constructor(public _id: any,
                public createdAt: Date,
                public updatedAt: Date,
                public deleteInd: boolean,
                public resourceVersion: string) {
        this.id = _id ? _id.toString() : undefined;
    }

    public save(fn?: (err: any, product: this, numAffected: number) => void): Promise<this> {
        return null;
    }

    public delete(): void {
        return null;
    }

    public enforcePermissions(templates: Permissions, enforcers: IPermissionEnforcer<any>[]): Promise<Permissions> {
        return null;
    }

    public abstract getPermissions(): Promise<Permissions>;

}

// RAMSchema ..........................................................................................................

export const RAMSchema = (schema: Object) => {

    //noinspection ReservedWordAsName
    const result = new mongoose.Schema({
        deleteInd: {type: Boolean, default: false},
        resourceVersion: {type: String, default: '1'}
    }, {timestamps: true});

    result.add(schema);

    result.plugin(mongooseIdValidator);
    result.plugin(mongooseDeepPopulate);

    result.method('delete', async function() {
        this.deleteInd = true;
        (this as IRAMObject).save();
    });

    result.method('enforcePermissions', async function(templates: Permissions, enforcers: IPermissionEnforcer<any>[]): Promise<Permissions> {
        let permissions = new Permissions();
        for (let template of templates.toArray()) {
            let enforcer: IPermissionEnforcer<any>;
            for (let anEnforcer of enforcers) {
                if (anEnforcer.template && anEnforcer.template.code === template.code) {
                    enforcer = anEnforcer;
                    break;
                }
            }
            if (enforcer) {
                permissions.push(await enforcer.evaluate(this));
            } else {
                permissions.push(template);
            }
        }
        return permissions;
    });

    return result;

};

// CodeDecode .........................................................................................................

/**
 * ICodeDecode defines the common attributes that all lookup documents in RAM will contain. Alongside,
 * IRAMObject, these two interfaces define all the models in the system.
 */
export interface ICodeDecode {
    _id: any;
    id: string;
    shortDecodeText: string;
    longDecodeText: string;
    startDate: Date;
    endDate: Date;
    code: string;
}

// exists for type safety only, do not add functions here
export class CodeDecode implements ICodeDecode {
    public id: string;

    constructor(public _id: any,
                public shortDecodeText: string,
                public longDecodeText: string,
                public startDate: Date,
                public endDate: Date,
                public code: string) {
        this.id = _id.toString();
    }
}

// CodeDecodeSchema ...................................................................................................

/* tslint:disable:max-func-body-length */
export const CodeDecodeSchema = (schema: Object) => {

    const result = new mongoose.Schema({
        shortDecodeText: {
            type: String,
            required: [true, 'Short description text is required'],
            trim: true
        },
        longDecodeText: {
            type: String,
            required: [true, 'Long description text is required'],
            trim: true
        },
        code: {
            type: String,
            required: [true, 'Code is required and must be string and unique'],
            trim: true,
            index: {unique: true}
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date
        }
    });

    result.add(schema);

    result.plugin(mongooseIdValidator);
    result.plugin(mongooseDeepPopulate);
    result.plugin(mongooseUniqueValidator);

    return result;
};

// Model ..............................................................................................................

/**
 * A helper to build a mongoose.model given a name, schema, instance and static contracts.
 *
 * @param name the name
 * @param schema the schema
 * @param instanceContract the instance contract
 * @param staticContract the static contract
 * @returns {Model} the mongoose model
 * @constructor
 */
export const Model = <T extends mongoose.Document>(name: string, schema: mongoose.Schema, instanceContract: any, staticContract?: any): mongoose.Model<T> => {

    // console.log('model: ', name);

    // loop through all immediately declared functions and add to the schema
    Object.getOwnPropertyNames(instanceContract.prototype).forEach((key, index) => {
        // console.log('  method: ' + key);
        let value = instanceContract.prototype[key];
        if (key !== 'constructor') {
            // console.log(key, value);
            schema.method(key, value);
        }
    });

    // loop through all immediately declared functions and add to the schema
    if (staticContract) {
        Object.getOwnPropertyNames(staticContract.prototype).forEach((key, index) => {
            // console.log('  static: ' + key);
            let value = staticContract.prototype[key];
            if (key !== 'constructor') {
                // console.log(key, value);
                schema.static(key, value);
            }
        });
    }

    return mongoose.model(name, schema) as mongoose.Model<T>;

};

// permission enforcer ................................................................................................

export interface IPermissionEnforcer<T> {
    template: IPermission;
    evaluate(source: T): Promise<IPermission>;
    assert(source: T): Promise<void>;
    isAllowed(source: T): Promise<boolean>;
    isDenied(source: T): Promise<boolean>;
    getLinkHref(source: T): Promise<string>;
}

export abstract class PermissionEnforcer<T> implements IPermissionEnforcer<T> {

    constructor(public template: IPermission) {
    }

    public abstract evaluate(source: T): Promise<IPermission>;

    public async assert(source: T): Promise<void> {
        let permission = await this.evaluate(source);
        Assert.assertPermission(permission);
    }

    public async isAllowed(source: T): Promise<boolean> {
        return (await this.evaluate(source)).isAllowed();
    }

    public async isDenied(source: T): Promise<boolean> {
        return (await this.evaluate(source)).isDenied();
    }

    public async getLinkHref(source: T): Promise<string> {
        let link = (await this.evaluate(source)).link;
        return link ? link.href : undefined;
    }

}

// helpers ............................................................................................................

/**
 * A proxy the pull function which only exists in mongoose.Types.DocumentArray.
 *
 * @param mongooseArray the mongoose array of type mongoose.Types.DocumentArray
 * @param value the value to remove
 */
export const removeFromArray = <T>(mongooseArray: Array<T>, value: Object) => {
    const typedMongooseArray = mongooseArray as mongoose.Types.DocumentArray<T>;
    typedMongooseArray.pull(value);
};

/**
 * A simple assertion utility for things like null, true, equal etc checks.
 */
export class Assert {

    public static assertNotNull(object: Object, failMessage: string, detail?: string) {
        if (!object) {
            if (detail) {
                logger.debug(`Assertion Failed: ${detail}`);
            }
            throw new Error(failMessage);
        }
    }

    public static assertTrue(condition: boolean, failMessage: string, detail?: string) {
        if (!condition) {
            if (detail) {
                logger.debug(`Assertion Failed: ${detail}`);
            }
            throw new Error(failMessage);
        }
    }

    public static assertEqual(value1: string, value2: string, failMessage: string) {
        const condition = value1 === value2;
        this.assertTrue(condition, failMessage, `${value1} != ${value2}`);
    }

    public static checkCaseInsensitiveEqual(value1: string, value2: string): boolean {
        return _.trim(value1).toLowerCase() === _.trim(value2).toLowerCase();
    }

    public static assertCaseInsensitiveEqual(value1: string, value2: string, failMessage: string, detail?: string) {
        const condition = Assert.checkCaseInsensitiveEqual(value1, value2);
        this.assertTrue(condition, failMessage, detail);
    }

    public static assertGreaterThanEqual(value: number, min: number, failMessage: string, detail?: string) {
        this.assertTrue(value >= min, failMessage, detail);
    }

    public static assertPermission(permission: IPermission) {
        if (!permission.isAllowed()) {
            throw new Error(permission.messages.length > 0 ? permission.messages[0] : undefined);
        }
    }

}

/**
 * A convenience class to build a query object, only adding criteria when specified. This class needs to be
 * seriously enhanced if it is to be a useful builder for all queries, as the implementation is currently naive.
 */
export class Query {

    private data: {[name: string]: Promise<Object>} = {};

    /**
     * Adds the given filter (name:value) only if 'condition' is truthy.
     */
    public when(condition: Object, name: string, callback: () => Promise<Object>) {
        if (condition) {
            this.data[name] = callback();
        }
        return this;
    }

    public async build(): Promise<Object> {
        try {
            const promises = Object.keys(this.data).map(val => this.data[val]);
            const values: Object[] = await Promise.all<Object>(promises);

            let i = 0;
            let result: {[name: string]: Object} = {};
            for (let key of Object.keys(this.data)) {
                result[key] = values[i];
                i = i + 1;
            }

            return result;

        } catch (e) {
            throw e;
        }
    }
}