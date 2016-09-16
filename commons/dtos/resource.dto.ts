import {ILink, IHasLinks} from './link.dto';
import {IPermission, IHasPermissions, Permission, Permissions} from './permission.dto';

export interface IResource extends IHasLinks, IHasPermissions {
    getLink(type: string): ILink;
    getLinkHref(type: string): string;
    getLinkByPermission(template: IPermission): ILink;
    getLinkHrefByPermission(template: IPermission): string;
    getPermission(template: IPermission): IPermission;
    getDeniedPermissions(templates: IPermission[]): IPermission[];
    isPermissionAllowed(templates: IPermission[]): boolean;
    isPermissionDenied(templates: IPermission[]): boolean;
}

export class Resource implements IResource {

    public _links: ILink[] = [];
    public _perms: IPermission[] = [];

    // todo add the other meta fields (https://github.com/atogov/RAM/wiki/ReST-JSON-payloads)

    constructor(permissions: Permissions) {
        if (permissions) {
            for (let permission of permissions.toArray()) {
                let clonedPermission = new Permission(
                    permission.code,
                    permission.description,
                    permission.value,
                    permission.linkType,
                    permission.messages,
                    undefined
                );
                this._perms.push(clonedPermission);
                if (permission.value && permission.link) {
                    this._links.push(permission.link);
                    clonedPermission.linkType = permission.link.type;
                }
            }
        }
    }

    public getLink(type: string): ILink {
        if (type) {
            for (let link of this._links) {
                if (link.type === type) {
                    return link;
                }
            }
        }
        return undefined;
    }

    public getLinkHref(type: string): string {
        let link = this.getLink(type);
        return link ? link.href : undefined;
    }

    public getLinkByPermission(template: IPermission): ILink {
        return this.getLink(template.linkType);
    }

    public getLinkHrefByPermission(template: IPermission): string {
        return this.getLinkHref(template.linkType);
    }

    public getPermission(template: IPermission): IPermission {
        return new Permissions()
            .pushAll(this._perms)
            .get(template);
    }

    public getDeniedPermissions(templates: IPermission[]): IPermission[] {
        return new Permissions()
            .pushAll(this._perms)
            .getDenied(templates);
    }

    public isPermissionAllowed(templates: IPermission[]): boolean {
        return new Permissions()
            .pushAll(this._perms)
            .isAllowed(templates);
    }

    public isPermissionDenied(templates: IPermission[]): boolean {
        return new Permissions()
            .pushAll(this._perms)
            .isDenied(templates);
    }

}
