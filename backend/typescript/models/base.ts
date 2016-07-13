import * as mongoose from 'mongoose';
import {logger} from '../logger';

/* tslint:disable:no-var-requires */
const mongooseUniqueValidator = require('mongoose-unique-validator');
/* tslint:disable:no-var-requires */
const mongooseIdValidator = require('mongoose-id-validator');
/* tslint:disable:no-var-requires */
const mongooseDeepPopulate = require('mongoose-deep-populate')(mongoose);

/**
 * A convenience class to build a query object, only adding criteria when specified.
 */
export class Query {

    private data:{[name:string]:Promise<Object>} = {};

    /**
     * Adds the given filter (name:value) only if 'condition' is truthy.
     */
    public when(condition:Object, name:string, callback:() => Promise<Object>) {
        if (condition) {
            this.data[name] = callback();
        }
        return this;
    }

    public async build():Promise<Object> {
        try {
            const promises = Object.keys(this.data).map(val => this.data[val]);
            const values:Object[] = await Promise.all<Object>(promises);

            let i = 0;
            let result:{[name:string]:Object} = {};
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

/* RAMEnum is a simple class construct that represents a enumerated type so we can work with classes not strings.
 */
export class RAMEnum {

    protected static AllValues:RAMEnum[];

    public static values<T extends RAMEnum>():T[] {
        return this.AllValues as T[];
    }

    public static valueStrings<T extends RAMEnum>():string[] {
        return this.AllValues.map((value:T) => value.name);
    }

    public static valueOf<T extends RAMEnum>(name:string):T {
        for (let type of this.AllValues) {
            if ((type as T).name === name) {
                return type as T;
            }
        }
        return null;
    }

    constructor(public name:string, public shortDecodeText:string) {
    }
}

/* A RAMObject defines the common attributes that all objects in the RAM
 * model will contain.
 * Most objects in RAM extend off the RAMObject
 */
export interface IRAMObject extends mongoose.Document {
    createdAt:Date;
    updatedAt:Date;
    deleteInd:boolean;
    resourceVersion:string;

    /** Instance methods */
    delete():void;
}

export const RAMSchema = (schema:Object) => {

    const result = new mongoose.Schema({
        deleteInd: {type: Boolean, default: false},
        resourceVersion: {type: String, default: '1'}
    }, {timestamps: true});

    result.add(schema);

    result.plugin(mongooseIdValidator);
    result.plugin(mongooseDeepPopulate);

    result.method('delete', function () {
        this.deleteInd = true;
        this.save();
    });

    return result;
};

export interface ICodeDecode extends mongoose.Document {
    shortDecodeText:string;
    longDecodeText:string;
    startDate:Date;
    endDate:Date;
    code:string;

    /** Instance methods below */

}

/* tslint:disable:max-func-body-length */
export const CodeDecodeSchema = (schema:Object) => {

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

export class Assert {
    public static assertTrue(condition:boolean, failMessage:string, detail?:string) {
        if (!condition) {
            if(detail) {
                logger.debug(`Assertion Failed: ${detail}`);
            }
            throw new Error(failMessage);
        }
    }
}
