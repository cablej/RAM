import {Builder} from './builder.dto';
import {ICodeDecode, CodeDecode} from './codeDecode.dto';

export interface IRoleAttributeName extends ICodeDecode {
    domain: string;
    classifier: string;
    category: string;
    permittedValues: string[];
}

export class RoleAttributeName extends CodeDecode implements IRoleAttributeName {
    public static build(sourceObject: any): IRoleAttributeName {
        return new Builder<IRoleAttributeName>(sourceObject, this)
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