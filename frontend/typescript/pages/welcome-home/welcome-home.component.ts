import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {FormBuilder} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {IPrincipal} from '../../../../commons/api';

@Component({
    selector: 'landing-home',
    templateUrl: 'welcome-home.component.html',
    directives: [ROUTER_DIRECTIVES]
})

export class WelcomeHomeComponent extends AbstractPageComponent {

    private me: IPrincipal = null;
    private _isLoading = true;

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Relationship Authorisation Manager');
    }

    public onInit(params: {path: Params, query: Params}) {

        const dashboard = params.path['dashboard'];

        // logged in principal
        this.services.rest.findMyPrincipal().subscribe(principal => {

            this.me = principal;

            if (dashboard === 'sps') {
                this.goToSoftwareProviderServicesPage();
            } else if (dashboard === 'auth' || !this.me.agencyUserInd) {
                this.goToAuthorisationsPage();
            } else {
                this._isLoading = false;
            }

        }, (err) => {
            this._isLoading = false;
        });

    }

    public goToAuthorisationsPage() {
        if (this.isAuthenticated()) {
            if (this.isAgencyUser()) {
                this.services.route.goToAgencySelectBusinessForAuthorisationsPage();
            } else {
                this.services.route.goToRelationshipsPage(
                    this.services.model.getLinkHrefByType(Constants.Link.SELF, this.me.identity)
                );
            }
        } else {
            this.clearGlobalMessages();
            this.addGlobalMessage('You are not currently logged in.');
        }
    }

    public goToSoftwareProviderServicesPage() {
        if (this.isAuthenticated()) {
            if (this.isAgencyUser()) {
                this.services.route.goToAgencySelectBusinessForSoftwareProviderServicesPage();
            } else {
                this.services.route.goToBusinessesPage();
            }
        } else {
            this.clearGlobalMessages();
            this.addGlobalMessage('You are not currently logged in.');
        }
    }

    private isAuthenticated() {
        return this.me !== null;
    }

    private isAgencyUser() {
        return this.me.agencyUserInd;
    }

    public get isLoading() {
        return this._isLoading;
    }

}