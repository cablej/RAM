/*
 * If you log in as an agency user and select 'Go to Software Provider
 * Services', you will be presented with this component. It is a thin
 * component over the business-select component - adding registration
 * of company in RAM and routing to the next page.
 */
import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, Router, ActivatedRoute, Params} from '@angular/router';
import {FormBuilder} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAgencyComponent} from '../../components/page-header/page-header-agency.component';
import {RAMServices} from '../../services/ram-services';
import { BusinessSelectComponent } from '../../components/business-select/business-select.component';
import {ABRentry} from '../../../../commons/api';
import {Constants} from '../../../../commons/constants';

@Component({
    selector: 'agency-select-business',
    templateUrl: 'agency-select-business.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        PageHeaderAgencyComponent,
        BusinessSelectComponent
    ]
})

export class AgencySelectBusinessComponent extends AbstractPageComponent {

    private dashboard: string;
    public falsy:boolean = false;

    /*
     * Capture the business entry returned by the business-select component.
     * Also used to only enable the "next" button when a business has been
     * selected. This is why it defaults to null.
     */
    public business:ABRentry = null;

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
    }

    /* tslint:disable:max-func-body-length */
    public onInit(params: {path: Params, query: Params}) {

        this.dashboard = params.path['dashboard'];

        // set banner title
        if (this.dashboard === 'auth') {
            this.setBannerTitle('Authorisations');
        } else {
            this.setBannerTitle('Software Provider Services');
        }
    }
    /*
     * Called by an event from the business-select component when the
     * operator hase found a business they like. This is not the same
     * as accepting the choice and moving on.
     */
    public selectBusiness(business: ABRentry) {
        this.business = business;
        // remove this if you want a next button
        this.acceptBusiness();
    }

    /*
     * This is called by a button local to this component and triggers the
     * move to the next screen.
     */
    public acceptBusiness() {
        this.services.rest.registerABRCompany(this.business).subscribe((identity) => {
            if (this.dashboard === 'auth') {
                this.services.route.goToRelationshipsPage(
                    this.services.model.getLinkHrefByType(Constants.Link.SELF, identity)
                );
            } else {
                let href = this.services.model.getLinkHrefByType('self', identity);
                this.services.route.goToNotificationsPage(href);
            }
        },(err:any) => {
            this.addGlobalErrorMessages(err);
        });
    }

    /*
     * On error this method is called - both by the local componentn and the
     * inner business-select component.
     */
    public displayErrors(errors:string[]) {
        this.addGlobalMessages(errors);
    }
}
