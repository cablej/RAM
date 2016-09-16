import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup} from '@angular/forms';
import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {
    SearchResultPaginationComponent,
    SearchResultPaginationDelegate
} from '../../components/search-result-pagination/search-result-pagination.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';
import {
    ISearchResult,
    IParty,
    IPartyType,
    IProfileProvider,
    IIdentity,
    IRelationship,
    IRelationshipType,
    IRelationshipStatus,
    IHrefValue,
    FilterParams
} from '../../../../commons/api';
import {IdentityCanCreateRelationshipPermission} from '../../../../commons/permissions/identityPermission.templates';
import {RelationshipCanModifyPermission, RelationshipCanAcceptPermission} from '../../../../commons/permissions/relationshipPermission.templates';

@Component({
    selector: 'list-relationships',
    templateUrl: 'relationships.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        PageHeaderAuthComponent,
        SearchResultPaginationComponent
    ]
})

export class RelationshipsComponent extends AbstractPageComponent {

    public identityHref: string;
    public filter: FilterParams;
    public page: number;

    public giveAuthorisationsEnabled: boolean = true;
    public identity: IIdentity;
    public relationshipRefs: ISearchResult<IHrefValue<IRelationship>>;
    public partyTypeRefs: IHrefValue<IPartyType>[];
    public profileProviderRefs: IHrefValue<IProfileProvider>[];
    public relationshipStatusRefs: IHrefValue<IRelationshipStatus>[];
    public relationshipTypeRefs: IHrefValue<IRelationshipType>[];
    public subjectGroupsWithRelationships: SubjectGroupWithRelationships[];

    public paginationDelegate: SearchResultPaginationDelegate;
    public form: FormGroup;

    private _isLoading = false; // set to true when you want the UI indicate something is getting loaded.

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Authorisations');
    }

    // todo need some way to indicate ALL the loading has finished; not a priority right now
    /* tslint:disable:max-func-body-length */
    public onInit(params: {path: Params, query: Params}) {

        this._isLoading = true;

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.filter = FilterParams.decode(params.query['filter']);
        this.page = params.query['page'] ? +params.query['page'] : 1;

        // restrict to authorisations
        this.filter.add('relationshipTypeCategory', Constants.RelationshipTypeCategory.AUTHORISATION);

        // message
        const msg = params.query['msg'];
        if (msg === Constants.GlobalMessage.DELEGATE_NOTIFIED) {
            this.addGlobalMessage('A notification has been sent to the delegate.');
        } else if (msg === Constants.GlobalMessage.DECLINED_RELATIONSHIP) {
            this.addGlobalMessage('You have declined the relationship.');
        } else if (msg === Constants.GlobalMessage.ACCEPTED_RELATIONSHIP) {
            this.addGlobalMessage('You have accepted the relationship.');
        } else if (msg === Constants.GlobalMessage.CANCEL_ACCEPT_RELATIONSHIP) {
            this.addGlobalMessage('You cancelled without accepting or declining the relationship');
        }

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });

        // party types
        this.services.rest.listPartyTypes().subscribe((partyTypeRefs) => {
            this.partyTypeRefs = partyTypeRefs;
        });

        // profile providers
        this.services.rest.listProfileProviders().subscribe((profileProviderRefs) => {
            this.profileProviderRefs = profileProviderRefs;
        });

        // relationship statuses
        this.services.rest.listRelationshipStatuses().subscribe((relationshipStatusRefs) => {
            this.relationshipStatusRefs = relationshipStatusRefs;
        });

        // relationship types
        this.services.rest.listRelationshipTypes().subscribe((relationshipTypeRefs) => {
            this.relationshipTypeRefs = relationshipTypeRefs.filter((relationshipType) => {
                return relationshipType.value.category === Constants.RelationshipTypeCategory.AUTHORISATION;
            });
        });

        // pagination delegate
        this.paginationDelegate = {
            goToPage: (page: number) => {
                this.services.route.goToRelationshipsPage(this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity), this.filter.encode(), page);
            }
        } as SearchResultPaginationDelegate;

        // forms
        this.form = this.fb.group({
            partyType: this.filter.get('partyType', '-'),
            relationshipType: this.filter.get('relationshipType', '-'),
            profileProvider: this.filter.get('profileProvider', '-'),
            status: this.filter.get('status', '-'),
            text: this.filter.get('text', ''),
            sort: this.filter.get('sort', '-')
        });

    }

    public onFindIdentity(identity: IIdentity) {

        this.identity = identity;

        // give authorisation permissions
        this.giveAuthorisationsEnabled = this.identity.isPermissionAllowed([IdentityCanCreateRelationshipPermission]);

        // relationships
        this.services.rest.searchRelationshipsByIdentity(this.identity.idValue, this.filter.encode(), this.page).subscribe({
            next: this.onSearchRelationships.bind(this),
            error: (err) => {
                this.onServerError(err);
                this._isLoading = false;
            }
        });

    }

    public onSearchRelationships(relationshipRefs: ISearchResult<IHrefValue<IRelationship>>) {

        this.relationshipRefs = relationshipRefs;
        this.subjectGroupsWithRelationships = [];

        for (const relationshipRef of relationshipRefs.list) {
            let subjectGroupWithRelationshipsToAddTo: SubjectGroupWithRelationships;
            const subjectRef = relationshipRef.value.subject;
            for (const subjectGroupWithRelationships of this.subjectGroupsWithRelationships) {
                if (subjectGroupWithRelationships.hasSameSubject(subjectRef)) {
                    subjectGroupWithRelationshipsToAddTo = subjectGroupWithRelationships;
                }
            }
            if (!subjectGroupWithRelationshipsToAddTo) {
                subjectGroupWithRelationshipsToAddTo = new SubjectGroupWithRelationships();
                subjectGroupWithRelationshipsToAddTo.subjectRef = subjectRef;
                this.subjectGroupsWithRelationships.push(subjectGroupWithRelationshipsToAddTo);
            }
            subjectGroupWithRelationshipsToAddTo.relationshipRefs.push(relationshipRef);
        }

        this._isLoading = false;

    }

    public commaSeparatedListOfProviderNames(subject: IParty): string {
        let providerNames: string[] = [];
        if (subject) {
            if (subject && subject.identities && subject.identities.length > 0) {
                for (const identityHrefValue of subject.identities) {
                    let label = this.services.model.profileProviderLabel(
                        this.profileProviderRefs,
                        identityHrefValue.value.profile.provider
                    );
                    providerNames.push(label);
                }
            }
        }
        return providerNames
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(',');
    }

    public get isLoading() {
        return this._isLoading;
    }

    public search() {
        const filterString = new FilterParams()
            .add('partyType', this.form.controls['partyType'].value)
            .add('relationshipType', this.form.controls['relationshipType'].value)
            .add('profileProvider', this.form.controls['profileProvider'].value)
            .add('status', this.form.controls['status'].value)
            .add('text', this.form.controls['text'].value)
            .add('sort', this.form.controls['sort'].value)
            .encode();
        //console.log('Filter (encoded): ' + filterString);
        //console.log('Filter (decoded): ' + JSON.stringify(FilterParams.decode(filterString), null, 4));
        this.services.route.goToRelationshipsPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity),
            filterString
        );
    }

    public goToRelationshipAddPage() {
        this.services.route.goToAddRelationshipPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity)
        );
    };

    public goToRelationshipEnterCodePage() {
        this.services.route.goToRelationshipEnterCodePage(this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity));
    };

    public goToRelationshipsContext(partyResource: IHrefValue<IParty>) {
        const defaultIdentityResource = this.services.model.getDefaultIdentityResource(partyResource.value);
        if (defaultIdentityResource) {
            this.services.route.goToRelationshipsPage(this.services.model.getLinkHrefByType(Constants.Link.SELF, defaultIdentityResource.value));
        }
    }

    public goToRelationshipPage(relationshipRef: IHrefValue<IRelationship>) {
        this.services.route.goToEditRelationshipPage(this.identityHref, relationshipRef.href);
    }

    public goToAcceptRejectRelationshipPage(relationshipRef: IHrefValue<IRelationship>) {
        this.services.route.goToRelationshipAcceptPage(this.identityHref, relationshipRef.href);
    }

    public isEditRelationshipEnabled(relationshipRef: IHrefValue<IRelationship>) {
        return relationshipRef.value.isPermissionAllowed([RelationshipCanModifyPermission]);
    }

    public isAcceptRejectRelationshipEnabled(relationshipRef: IHrefValue<IRelationship>) {
        return relationshipRef.value.isPermissionAllowed([RelationshipCanAcceptPermission]);
    }

}

class SubjectGroupWithRelationships {

    public subjectRef: IHrefValue<IParty>;
    public relationshipRefs: IHrefValue<IRelationship>[] = [];

    public hasSameSubject(aSubjectRef: IHrefValue<IParty>) {
        return this.subjectRef.href === aSubjectRef.href;
    }

}