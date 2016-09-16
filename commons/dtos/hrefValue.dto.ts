import {Builder} from './builder.dto';

export interface IHrefValue<T> {
    href: string;
    value?: T;
    getFromList(refs: IHrefValue<T>[]): IHrefValue<T>;
}

export class HrefValue<T> implements IHrefValue<T> {

    public static build<T2>(sourceObject: any, targetClass: any): HrefValue<T2> {
        return new Builder<HrefValue<T2>>(sourceObject, this)
            .map('value', targetClass)
            .build();
    }

    constructor(public href: string,
                public value?: T) {
    }

    public getFromList(refs: IHrefValue<T>[]): IHrefValue<T> {
        for (let ref of refs) {
            if (ref.href === this.href) {
                return ref;
            }
        }
        return null;
    }

}