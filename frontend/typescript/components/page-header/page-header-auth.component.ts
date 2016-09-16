import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';

import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {IIdentity} from '../../../../commons/api';
import {IdentityCanCreateRelationshipPermission} from '../../../../commons/permissions/identityPermission.templates';

@Component({
    selector: 'page-header',
    templateUrl: 'page-header-auth.component.html',
    directives: []
})

// todo refactor this to use hrefs
export class PageHeaderAuthComponent {

    @Input() public identity: IIdentity;
    @Input() public tab: string;
    @Input() public messages: string[];
    @Input() public giveAuthorisationsEnabled: boolean = false;

    constructor(private router: Router,
                private services: RAMServices) {
    }

    public hasMessages(): boolean {
        return this.messages && this.messages.length > 0;
    }

    public title(): string {
        return this.identity ? this.services.model.displayNameForIdentity(this.identity) : 'Loading ...';
    }

    public getIdentityHref(): string {
        if (this.identity) {
            return this.services.model.getLinkHrefByType('self', this.identity);
        }
        return undefined;
    }

    public goToRelationshipsPage() {
        if (this.identity) {
            this.services.route.goToRelationshipsPage(
                this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity)
            );
        }
    };

    public goToGiveAuthorisationPage() {
        if (this.isGiveAuthorisationsPageEnabled()) {
            if (this.identity) {
                this.services.route.goToAddRelationshipPage(
                    this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity)
                );
            }
        }
    };

    public goToGetAuthorisationPage() {
        if (this.identity) {
            this.services.route.goToRelationshipEnterCodePage(
                this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity)
            );
        }
    };

    // todo logins page
    public goToLoginsPage() {
        if (this.identity) {
            if (this.isLoginsPageEnabled()) {
                alert('TODO: MANAGE LOGINS');
            }
        }
    };

    public goToRolesPage() {
        if (this.identity) {
            if (this.isRolesPageEnabled()) {
                this.services.route.goToRolesPage(this.getIdentityHref());
            }
        }
    };

    public isGiveAuthorisationsPageEnabled() {
        return this.identity !== null &&
            this.identity !== undefined &&
            this.identity.isPermissionAllowed([IdentityCanCreateRelationshipPermission]);
    }

    // todo logins page
    public isLoginsPageEnabled() {
        return false;
    }

    // todo verify logic
    public isRolesPageEnabled() {
        return this.identity !== null &&
            this.identity !== undefined &&
            !this.services.model.isIndividual(this.identity);
    }

}