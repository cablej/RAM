import {Builder} from './builder.dto';
import {ILink} from './link.dto';

export interface IPermission {
    code: string;
    description: string;
    value: boolean;
    messages: string[];
    link: ILink;
    linkType: string;
    isAllowed(): boolean;
    isDenied(): boolean;
}

export class Permission implements IPermission {

    public static build(sourceObject: any): IPermission {
        return new Builder<IPermission>(sourceObject, this)
            .build();
    }

    constructor(public code: string,
                public description: string,
                public value: boolean,
                public linkType?: string,
                public messages?: string[],
                public link?: ILink) {
        if (!messages) {
            this.messages = [];
        }
        if (link) {
            this.linkType = link.type;
        }
    }

    public isAllowed(): boolean {
        return this.value;
    }

    public isDenied(): boolean {
        return !this.isAllowed();
    }

    public hasMessages(): boolean {
        return this.messages && this.messages.length > 0;
    }

}

export interface IHasPermissions {
    _perms: IPermission[];
}

export class Permissions {

    private array: IPermission[] = [];

    public push(permission: IPermission, condition: boolean = true): Permissions {
        if (condition) {
            this.array.push(permission);
        }
        return this;
    }

    public pushAll(permissions: IPermission[]): Permissions {
        for (let permission of permissions) {
            this.array.push(permission);
        }
        return this;
    }

    public get(template: IPermission): IPermission {
        for (let permission of this.array) {
            if (template.code === permission.code) {
                return permission;
            }
        }
        return undefined;
    }

    public getDenied(templates: IPermission[]): IPermission[] {
        let notAllowedPermissions: IPermission[] = [];
        if (templates) {
            for (let template of templates) {
                let found = false;
                for (let permission of this.array) {
                    if (template.code === permission.code) {
                        found = true;
                        if (!permission.isAllowed()) {
                            notAllowedPermissions.push(permission);
                        }
                        break;
                    }
                }
                if (!found) {
                    throw new Error('Permission not found: ' + template.code);
                }
            }
            return notAllowedPermissions;
        }
    }

    public isAllowed(templates: IPermission[]): boolean {
        return this.getDenied(templates).length === 0;
    }

    public isDenied(templates: IPermission[]): boolean {
        return !this.isAllowed(templates);
    }

    public toArray(): IPermission[] {
        return this.array;
    }

}
