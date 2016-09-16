import {Link} from './link.dto';
import {Permission} from './permission.dto';
import {HrefValue} from './hrefValue.dto';
import {Utils} from '../utils';

export class Builder<T> {

    private targetObject: any;
    private knownKeys: string[] = [];

    constructor(public sourceObject: any, public targetClass: any) {
        this.targetObject = Object.create(targetClass.prototype);
    }

    public mapHref(key: string, targetClass: any): Builder<T> {
        return this.map(key, HrefValue, targetClass);
    }

    public map(key: string, targetClass: any, targetGenericClass?: any): Builder<T> {
        if (key !== null && key !== undefined) {
            this.knownKeys.push(key);
            const newSourceObject = this.sourceObject[key];
            if (newSourceObject !== null && newSourceObject !== undefined && typeof newSourceObject === 'object') {
                //noinspection UnnecessaryLocalVariableJS
                const newTargetObject = targetClass.build(newSourceObject, targetGenericClass ? targetGenericClass : targetClass);
                this.targetObject[key] = newTargetObject;
            }
        }
        return this;
    }

    public mapArray(key: string, targetClass: any, targetGenericClass?: any): Builder<T> {
        if (key !== null && key !== undefined) {
            this.knownKeys.push(key);
            const newTargetObjectArray: any[] = [];
            const newSourceObjectArray = this.sourceObject[key];
            if (newSourceObjectArray !== null && newSourceObjectArray !== undefined) {
                for (let newSourceObject of newSourceObjectArray) {
                    if (newSourceObject !== null && newSourceObject !== undefined && typeof newSourceObject === 'object') {
                        const newTargetObject = targetClass.build(newSourceObject, targetGenericClass ? targetGenericClass : targetClass);
                        newTargetObjectArray.push(newTargetObject);
                    }
                }
            }
            this.targetObject[key] = newTargetObjectArray;
        }
        return this;
    }

    private mapPrimitives(sourceObject: any, targetObject: any) {
        for (let key of Object.keys(sourceObject)) {
            if (this.knownKeys.indexOf(key) === -1) {
                let origValue = sourceObject[key];
                let value = origValue;
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        let valueArray = value as Object[];
                        value = valueArray.length > 0 ? valueArray[0] : undefined;
                    }
                    if (key === 'timestamp' || key.indexOf('Timestamp') !== -1 || Utils.endsWith(key, 'At')) {
                        // date
                        targetObject[key] = new Date(value);
                    } else if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
                        // number, string, boolean
                        targetObject[key] = origValue;
                    }
                }
            }
        }
    }

    public build(): T {
        this.mapArray('_links', Link);
        this.mapArray('_perms', Permission);
        this.mapPrimitives(this.sourceObject, this.targetObject);
        return this.targetObject as T;
    }

}