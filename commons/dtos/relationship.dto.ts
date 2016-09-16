import {Builder} from './builder.dto';
import {Permissions} from './permission.dto';
import {IHrefValue} from './hrefValue.dto';
import {IName, Name} from './name.dto';
import {IParty, Party} from './party.dto';
import {IRelationshipAttribute, RelationshipAttribute} from './relationshipAttribute.dto';
import {RelationshipType, IRelationshipType} from './relationshipType.dto';
import {IResource, Resource} from './resource.dto';
import {PermissionTemplates} from '../permissions/allPermission.templates';
import {Constants} from '../constants';

export interface IRelationship extends IResource {
    relationshipType: IHrefValue<IRelationshipType>;
    subject: IHrefValue<IParty>;
    subjectNickName?: IName;
    delegate: IHrefValue<IParty>;
    delegateNickName?: IName;
    startTimestamp: Date;
    endTimestamp?: Date;
    endEventTimestamp?: Date;
    status: string;
    initiatedBy: string;
    supersededBy: IHrefValue<IRelationship>;
    attributes: IRelationshipAttribute[];
    getAttribute(code: string): IRelationshipAttribute;
    insertOrUpdateAttribute(attribute: IRelationshipAttribute): void;
    deleteAttribute(code: string): void;
    isPending(): boolean;
}

export class Relationship extends Resource implements IRelationship {

    public static build(sourceObject: any): IRelationship {
        return new Builder<IRelationship>(sourceObject, this)
            .mapHref('relationshipType', RelationshipType)
            .mapHref('subject', Party)
            .mapHref('delegate', Party)
            .mapHref('supersededBy', Relationship)
            .map('subjectNickName', Name)
            .map('delegateNickName', Name)
            .mapArray('attributes', RelationshipAttribute)
            .build();
    }

    constructor(permissions: Permissions,
                public relationshipType: IHrefValue<IRelationshipType>,
                public subject: IHrefValue<IParty>,
                public subjectNickName: Name,
                public delegate: IHrefValue<IParty>,
                public delegateNickName: Name,
                public startTimestamp: Date,
                public endTimestamp: Date,
                public endEventTimestamp: Date,
                public status: string,
                public initiatedBy: string,
                public supersededBy: IHrefValue<IRelationship>,
                public attributes: IRelationshipAttribute[]) {
        super(permissions ? permissions : PermissionTemplates.relationship);
    }

    public getAttribute(code: string): IRelationshipAttribute {
        for (let attribute of this.attributes) {
            if (attribute.attributeName.value.code === code) {
                return attribute;
            }
        }
        return null;
    }

    public insertOrUpdateAttribute(attribute: IRelationshipAttribute) {
        if (attribute) {
            this.deleteAttribute(attribute.attributeName.value.code);
            this.attributes.push(attribute);
        }
    }

    public deleteAttribute(code: string) {
        if (code) {
            for (let i = 0; i < this.attributes.length; i = i + 1) {
                let aAttribute = this.attributes[i];
                if (aAttribute.attributeName.value.code === code) {
                    this.attributes.splice(i, 1);
                    break;
                }
            }
        }
    }

    public isPending(): boolean {
        return this.status === Constants.RelationshipStatusCode.PENDING;
    }

}