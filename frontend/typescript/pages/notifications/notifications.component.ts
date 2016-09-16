import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, Router, ActivatedRoute, Params} from '@angular/router';
import {FormBuilder} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderSPSComponent} from '../../components/page-header/page-header-sps.component';
import {SearchResultPaginationComponent, SearchResultPaginationDelegate}
    from '../../components/search-result-pagination/search-result-pagination.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {
    ISearchResult,
    IIdentity,
    IRelationship,
    IRelationshipStatus,
    IHrefValue,
    FilterParams,
    IPrincipal, IParty
} from '../../../../commons/api';

@Component({
    selector: 'ram-osp-notifications',
    templateUrl: 'notifications.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        PageHeaderSPSComponent,
        SearchResultPaginationComponent
    ]
})

export class NotificationsComponent extends AbstractPageComponent {

    public identityHref: string;
    public filter: FilterParams;
    public page: number;

    public relationshipSearchResult: ISearchResult<IHrefValue<IRelationship>>;
    public relationshipStatusRefs: IHrefValue<IRelationshipStatus>[];

    public me: IPrincipal;
    public identity: IIdentity;
    public subjectsTotalCount: number;

    public paginationDelegate: SearchResultPaginationDelegate;

    private _isLoading = false; // set to true when you want the UI indicate something is getting loaded.

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Software Provider Services');
    }

    public onInit(params: {path: Params, query: Params}) {

        this._isLoading = true;

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.filter = FilterParams.decode(params.query['filter']);
        this.page = params.query['page'] ? +params.query['page'] : 1;

        // restrict to notifications
        this.filter.add('relationshipTypeCategory', Constants.RelationshipTypeCategory.NOTIFICATION);

        // message
        const msg = params.query['msg'];
        if (msg === Constants.GlobalMessage.SAVED_NOTIFICATION) {
            this.addGlobalMessage('The notification has been saved successfully.');
        }

        // me
        this.services.rest.findMyPrincipal().subscribe({
            next: this.onFindMe.bind(this),
            error: this.onServerError.bind(this)
        });

        // all subjects
        let allSubjectsFilterParams = new FilterParams()
            .add('partyType', 'ABN')
            .add('authorisationManagement', true);
        this.services.rest.searchDistinctSubjectsForMe(allSubjectsFilterParams.encode(), 1).subscribe({
            next: this.onListAllSubjects.bind(this),
            error: this.onServerError.bind(this)
        });

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });

        // pagination delegate
        this.paginationDelegate = {
            goToPage: (page: number) => {
                this.services.route.goToNotificationsPage(this.identityHref, page);
            }
        } as SearchResultPaginationDelegate;

    }

    private onFindMe(me: IPrincipal) {
        this.me = me;
    }

    private onListAllSubjects(partySearchResults: ISearchResult<IHrefValue<IParty>>) {
        this.subjectsTotalCount = partySearchResults.totalCount;
    }

    public onFindIdentity(identity: IIdentity) {

        this.identity = identity;

        // relationships
        this.services.rest.searchRelationshipsByIdentity(this.identity.idValue, this.filter.encode(), this.page).subscribe({
            next: (searchResult) => {
                this.relationshipSearchResult = searchResult;
                this._isLoading = false;
            },
            error: (err) => {
                this.onServerError(err);
                this._isLoading = false;
            }
        });

        // relationship statuses
        this.services.rest.listRelationshipStatuses().subscribe({
            next: (relationshipStatusRefs) => {
                this.relationshipStatusRefs = relationshipStatusRefs;
            },
            error: this.onServerError.bind(this)
        });

    }

    public goToBusinessesPage() {
        this.services.route.goToBusinessesPage();
    }

    public goToAddNotificationPage() {
        this.services.route.goToAddNotificationPage(this.identityHref);
    }

    public goToEditNotificationPage(relationshipRef: IHrefValue<IRelationship>) {
        this.services.route.goToEditNotificationPage(this.identityHref, relationshipRef.href);
    }

    public isAddNotificationEnabled(): boolean {
        if (this.identity) {
            return this.services.model.hasLinkHrefByType(Constants.Link.RELATIONSHIP_CREATE, this.identity);
        }
        return false;
    }

    public isEditNotificationEnabled(relationshipRef: IHrefValue<IRelationship>): boolean {
        return this.services.model.hasLinkHrefByType(Constants.Link.MODIFY, relationshipRef.value);
    }

    public isDashboardEnabled(): boolean {
        return this.subjectsTotalCount > 0;
    }

}
