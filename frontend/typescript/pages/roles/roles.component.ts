import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup, FORM_DIRECTIVES} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {SearchResultPaginationComponent, SearchResultPaginationDelegate}
    from '../../components/search-result-pagination/search-result-pagination.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {
    IHrefValue,
    ISearchResult,
    IAgencyUser,
    IIdentity,
    IRole,
    IRoleStatus,
    IRoleType
} from '../../../../commons/api';

@Component({
    selector: 'ram-roles',
    templateUrl: 'roles.component.html',
    directives: [
        REACTIVE_FORM_DIRECTIVES,
        FORM_DIRECTIVES,
        ROUTER_DIRECTIVES,
        PageHeaderAuthComponent,
        SearchResultPaginationComponent
    ]
})

export class RolesComponent extends AbstractPageComponent {

    public identityHref: string;
    public page: number;

    public roleSearchResult: ISearchResult<IHrefValue<IRole>>;

    public agencyUser: IAgencyUser;
    public identity: IIdentity;
    public roleTypeRefs: IHrefValue<IRoleType>[];
    public roleStatusRefs: IHrefValue<IRoleStatus>[];

    public paginationDelegate: SearchResultPaginationDelegate;
    public form: FormGroup;

    private _isLoading = false; // set to true when you want the UI indicate something is getting loaded.

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Authorisations');
    }

    public onInit(params: {path:Params, query:Params}) {

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.page = params.query['page'] ? +params.query['page'] : 1;

        // agency user
        this.services.rest.findMyPrincipal().subscribe((me) => {
            this.agencyUser = me.agencyUser;
        });

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe((identity) => {

            this.identity = identity;

            // roles
            const rolesHref = this.services.model.getLinkHrefByType(Constants.Link.ROLE_LIST, this.identity);
            this.services.rest.searchRolesByHref(rolesHref, null, this.page)
                .subscribe((searchResult) => {
                    this.roleSearchResult = searchResult;
                    this._isLoading = false;
                }, (err) => {
                    this.addGlobalErrorMessages(err);
                    this._isLoading = false;
                });

        });

        // role types
        this.services.rest.listRoleTypes().subscribe((roleTypeRefs) => {
            this.roleTypeRefs = roleTypeRefs;
        });

        // role statuses
        this.services.rest.listRoleStatuses().subscribe((roleStatusRefs) => {
            this.roleStatusRefs = roleStatusRefs;
        });

        // pagination delegate
        this.paginationDelegate = {
            goToPage: (page: number) => {
                this.services.route.goToRolesPage(this.identityHref, page);
            }
        } as SearchResultPaginationDelegate;

        // forms
        this.form = this.fb.group({
        });

    }

    public get isLoading() {
        return this._isLoading;
    }

    public goToAddRolePage() {
        if (this.agencyUser && this.identity) {
            this.services.route.goToAddRolePage(this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity));
        }
    }

    public goToRolePage(roleRef: IHrefValue<IRole>) {
        this.services.route.goToEditRolePage(
            this.identityHref,
            this.services.model.getLinkHrefByType('self', roleRef.value)
        );
    }

    public isAddRoleEnabled() {
        return this.agencyUser !== null && this.agencyUser !== undefined;
    }

    public isEditRoleEnabled(roleRef: IHrefValue<IRole>) {
        return this.services.model.hasLinkHrefByType(Constants.Link.MODIFY, roleRef.value);
    }

}
