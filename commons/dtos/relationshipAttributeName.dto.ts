import {Builder} from './builder.dto';
import {ICodeDecode, CodeDecode} from './codeDecode.dto';

export interface IRelationshipAttributeName extends ICodeDecode {
    domain: string;
    classifier: string;
    category: string;
    permittedValues: string[];
    appliesToInstance: boolean;
}

export class RelationshipAttributeName extends CodeDecode implements IRelationshipAttributeName {
    public static build(sourceObject: any): IRelationshipAttributeName {
        return new Builder<IRelationshipAttributeName>(sourceObject, this)
            .build();
    }

    constructor(code: string,
                shortDecodeText: string,
                longDecodeText: string,
                startTimestamp: Date,
                endTimestamp: Date,
                public name: string,
                public domain: string,
                public classifier: string,
                public category: string,
                public permittedValues: string[],
                public appliesToInstance: boolean) {
        super(code, shortDecodeText, longDecodeText, startTimestamp, endTimestamp);
    }
}