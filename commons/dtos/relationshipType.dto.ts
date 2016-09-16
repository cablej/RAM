import {Builder} from './builder.dto';
import {ICodeDecode, CodeDecode} from './codeDecode.dto';
import {IHrefValue} from './hrefValue.dto';
import {IRelationshipAttributeNameUsage, RelationshipAttributeNameUsage} from './relationshipAttributeNameUsage.dto';
import {IRelationshipAttributeName} from './relationshipAttributeName.dto';

export interface IRelationshipType extends ICodeDecode {
    strength: number;
    minCredentialStrength: number;
    minIdentityStrength: number;
    relationshipAttributeNames: IRelationshipAttributeNameUsage[];
    category: string;
    getAttributeNameUsage(code: string): IRelationshipAttributeNameUsage;
    getAttributeNameRef(code: string): IHrefValue<IRelationshipAttributeName>;
    getAttributeName(code: string): IRelationshipAttributeName;
}

export class RelationshipType extends CodeDecode implements IRelationshipType {

    public static build(sourceObject: any): IRelationshipType {
        return new Builder<IRelationshipType>(sourceObject, this)
            .mapArray('relationshipAttributeNames', RelationshipAttributeNameUsage)
            .build();
    }

    constructor(code: string,
                shortDecodeText: string,
                longDecodeText: string,
                startTimestamp: Date,
                endTimestamp: Date,
                public strength: number,
                public minCredentialStrength: number,
                public minIdentityStrength: number,
                public category: string,
                public relationshipAttributeNames: RelationshipAttributeNameUsage[]) {
        super(code, shortDecodeText, longDecodeText, startTimestamp, endTimestamp);
    }

    public getAttributeNameUsage(code: string): IRelationshipAttributeNameUsage {
        for (let usage of this.relationshipAttributeNames) {
            if (usage.attributeNameDef.value.code === code) {
                return usage;
            }
        }
        return null;
    }

    public getAttributeNameRef(code: string): IHrefValue<IRelationshipAttributeName> {
        let usage = this.getAttributeNameUsage(code);
        return usage ? usage.attributeNameDef : null;
    }

    public getAttributeName(code: string): IRelationshipAttributeName {
        let ref = this.getAttributeNameRef(code);
        return ref ? ref.value : null;
    }

}