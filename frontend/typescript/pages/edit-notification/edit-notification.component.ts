// import {Observable} from 'rxjs/Rx';
import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, Router, ActivatedRoute, Params} from '@angular/router';
import {
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FORM_DIRECTIVES,
    Validators,
    FormControl,
    FormArray
} from '@angular/forms';
import {Calendar} from 'primeng/primeng';
import {AccessPeriodComponent, AccessPeriodComponentData} from '../../components/access-period/access-period.component';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderSPSComponent} from '../../components/page-header/page-header-sps.component';
import {MarkdownComponent} from '../../components/ng2-markdown/ng2-markdown.component';
import {RAMServices} from '../../services/ram-services';
import {Constants} from '../../../../commons/constants';
import {RAMNgValidators} from '../../commons/ram-ng-validators';

import {
    IIdentity,
    IParty,
    IHrefValue,
    HrefValue,
    IRole,
    IRoleAttributeName,
    IRelationshipType,
    Relationship,
    IRelationship,
    IRelationshipAttribute,
    RelationshipAttribute,
    FilterParams,
    ISearchResult
} from '../../../../commons/api';
import {Utils} from '../../../../commons/utils';

@Component({
    selector: 'ram-osp-notification-add',
    templateUrl: 'edit-notification.component.html',
    directives: [
        REACTIVE_FORM_DIRECTIVES,
        FORM_DIRECTIVES,
        ROUTER_DIRECTIVES,
        PageHeaderSPSComponent,
        Calendar,
        AccessPeriodComponent,
        MarkdownComponent
    ]
})

export class EditNotificationComponent extends AbstractPageComponent {

    public identityHref: string;
    public relationshipHref: string;

    public delegateParty: IParty;
    public delegateIdentityRef: IHrefValue<IIdentity>;

    public accessPeriod: AccessPeriodComponentData = {
        startDateEnabled: true,
        startDate: new Date(),
        noEndDate: true,
        endDate: null
    };

    public identity: IIdentity;
    public relationship: IRelationship;
    public ospRelationshipTypeRef: IHrefValue<IRelationshipType>;
    public ospRoleRef: IHrefValue<IRole>;
    public ospServices: IRoleAttributeName[];
    public originalStartDate: Date;
    public declarationText: string;

    public form: FormGroup;

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Software Provider Services');
    }

    public onInit(params: {path: Params, query: Params}) {

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.relationshipHref = params.path['relationshipHref'];

        // forms
        this.form = this.fb.group({
            abn: [null, Validators.compose([Validators.required, RAMNgValidators.validateABNFormat])],
            accepted: [false],
            agencyServices: [[]],
            ssids: this.fb.array([this.fb.control(null, Validators.required)])
        });

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });

    }

    public onFindIdentity(identity: IIdentity) {

        this.identity = identity;

        // osp relationship type
        this.services.rest.listRelationshipTypes().subscribe({
            next: this.onListRelationshipTypes.bind(this),
            error: this.onServerError.bind(this)
        });

        // relationship in focus
        if (this.relationshipHref) {
            this.services.rest.findRelationshipByHref(this.relationshipHref).subscribe({
                next: this.onFindRelationship.bind(this),
                error: this.onServerError.bind(this)
            });
        } else {
            this.onNewRelationship();
        }

    }

    public onListRelationshipTypes(relationshipTypeRefs: IHrefValue<IRelationshipType>[]) {
        for (let ref of relationshipTypeRefs) {
            if (ref.value.code === Constants.RelationshipTypeCode.OSP) {
                this.ospRelationshipTypeRef = ref;
                this.declarationText = this.services.model.getRelationshipTypeAttributeNameUsage(ref,
                    Constants.RelationshipAttributeNameCode.SUBJECT_RELATIONSHIP_TYPE_DECLARATION).defaultValue;
                break;
            }
        }
    }

    public onFindRelationship(relationship: IRelationship) {

        this.relationship = relationship;

        if (!this.services.model.hasLinkHrefByType(Constants.Link.MODIFY, this.relationship)) {
            // no modify access
            this.services.route.goToAccessDeniedPage();
        } else {

            let delegate = relationship.delegate.value;
            let abn = this.services.model.abnForParty(delegate);

            // abn
            (this.form.controls['abn'] as FormControl).updateValue(abn);
            this.findByABN();

            // ssid
            let ssidsAttribute = this.services.model.getRelationshipAttribute(relationship, Constants.RelationshipAttributeNameCode.SSID, null);
            if (ssidsAttribute && ssidsAttribute.value) {
                let ssids = ssidsAttribute.value;
                this.getSSIDFormArray().removeAt(0);
                for (let i = 0; i < ssids.length; i = i + 1) {
                    this.getSSIDFormArray().push(this.fb.control(ssids[i], Validators.required));
                }
            }

            // date
            this.originalStartDate = relationship.startTimestamp;

            this.accessPeriod = {
                startDate: relationship.startTimestamp,
                endDate: relationship.endTimestamp,
                noEndDate: relationship.endTimestamp === undefined || relationship.endTimestamp === null,
                startDateEnabled: Utils.dateIsInFuture(this.originalStartDate)
            };

            // agency services
            let agencyServicesAttribute = this.services.model.getRelationshipAttribute(relationship, Constants.RelationshipAttributeNameCode.SELECTED_GOVERNMENT_SERVICES_LIST, null);
            if (agencyServicesAttribute && agencyServicesAttribute.value) {
                let agencyServices = agencyServicesAttribute.value;
                (this.form.controls['agencyServices'] as FormControl).updateValue(agencyServices);
            }

        }

    }

    public onNewRelationship() {

        // relationship
        this.relationship = new Relationship(
            null,
            null,
            new HrefValue(this.identity.party.href, null),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            Constants.RelationshipInitiatedBy.SUBJECT,
            null,
            []
        );

        // date
        this.originalStartDate = this.accessPeriod.startDate;
        this.accessPeriod.startDateEnabled = true;

    }

    public back() {
        this.services.route.goToNotificationsPage(this.identityHref);
    }

    public save() {

        this.clearGlobalMessages();

        let validationOk = true;
        let ssids = this.getSSIDs();
        const agencyServiceCodes = this.form.controls['agencyServices'].value;
        let accepted = this.form.controls['accepted'].value;

        if (!this.delegateIdentityRef) {
            validationOk = false;
            this.addGlobalMessage('Please select a software provider to link to.');
        } else {
            let notEmpty = (element: string) => {
                return element !== null && element !== undefined && element !== '';
            };
            let todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);
            if (!this.accessPeriod.startDate) {
                validationOk = false;
                this.addGlobalMessage('Please specify a start date.');
            }
            if (!this.accessPeriod.endDate && !this.accessPeriod.noEndDate) {
                validationOk = false;
                this.addGlobalMessage('Please specify an end date.');
            }
            if (this.relationshipHref) {
                if (this.accessPeriod.startDate && this.accessPeriod.startDate < todayMidnight) {
                    validationOk = false;
                    this.addGlobalMessage('Please specify a start date from today to the future.');
                }
            }
            if (!ssids || ssids.length === 0 || !ssids.every(notEmpty)) {
                validationOk = false;
                this.addGlobalMessage('Please specify valid software ids.');
            }
            if (!this.relationshipHref) {
                if (!agencyServiceCodes || agencyServiceCodes.length === 0) {
                    validationOk = false;
                    this.addGlobalMessage('Please specify at least one agency service.');
                }
            }
            if (!accepted) {
                validationOk = false;
                this.addGlobalMessage('Please accept the declaration.');
            }
        }

        if (validationOk && this.ospRelationshipTypeRef) {

            let attributes: IRelationshipAttribute[] = [];

            // ssid attribute
            attributes.push(new RelationshipAttribute(ssids,
                this.services.model.getRelationshipTypeAttributeNameRef(
                    this.ospRelationshipTypeRef, Constants.RelationshipAttributeNameCode.SSID)));

            // agency services
            attributes.push(new RelationshipAttribute(agencyServiceCodes,
                this.services.model.getRelationshipTypeAttributeNameRef(
                    this.ospRelationshipTypeRef, Constants.RelationshipAttributeNameCode.SELECTED_GOVERNMENT_SERVICES_LIST)));

            // save
            if (!this.relationshipHref) {

                // insert relationship

                this.relationship.relationshipType = this.ospRelationshipTypeRef;
                this.relationship.delegate = this.delegateIdentityRef.value.party;
                this.relationship.startTimestamp = this.accessPeriod.startDate;
                this.relationship.endTimestamp = this.accessPeriod.endDate;
                this.relationship.attributes = attributes;

                let saveHref = this.services.model.getLinkHrefByType(Constants.Link.RELATIONSHIP_CREATE, this.identity);
                this.services.rest.insertRelationshipByHref(saveHref, this.relationship).subscribe({
                    next: this.onSave.bind(this),
                    error: this.onServerError.bind(this)
                });

            } else {

                // update relationship
                this.relationship.startTimestamp = this.accessPeriod.startDate;
                this.relationship.endTimestamp = this.accessPeriod.endDate;
                this.relationship.attributes = attributes;

                let saveHref = this.services.model.getLinkHrefByType(Constants.Link.MODIFY, this.relationship);
                this.services.rest.updateRelationshipByHref(saveHref, this.relationship).subscribe({
                    next: this.onSave.bind(this),
                    error: this.onServerError.bind(this)
                });

            }

        }

    }

    public onSave() {
        this.services.route.goToNotificationsPage(this.identityHref, 1, Constants.GlobalMessage.SAVED_NOTIFICATION);
    }

    public resetDelegate() {
        this.delegateParty = null;
        this.delegateIdentityRef = null;
        (this.form.controls['abn'] as FormControl).updateValue('');
        (this.form.controls['agencyServices'] as FormControl).updateValue([]);
        (this.form.controls['accepted'] as FormControl).updateValue(false);
    }

    public findByABN() {

        this.clearGlobalMessages();

        const abn = this.form.controls['abn'].value.replace(/ /g, '');

        this.services.rest.findPartyByABN(abn).subscribe({
            next: (party) => {
                this.onFindPartyByABN(party, abn);
            },
            error: (err) => {
                if (err.status === 404) {
                    this.addGlobalMessages(['Cannot match ABN']);
                } else {
                    this.onServerError(err);
                }
            }
        });

    }

    public onFindPartyByABN(party: IParty, abn: string) {

        for (let identityRef of party.identities) {

            if (identityRef.value.rawIdValue === abn) {

                let href = this.services.model.getLinkHrefByType('role-list', identityRef.value);
                const filterString = new FilterParams()
                    .add('roleType', Constants.RoleTypeCode.OSP)
                    .add('status', Constants.RoleStatusCode.ACTIVE)
                    .add('inDateRange', true)
                    .encode();

                this.services.rest.searchRolesByHref(href, filterString, 1).subscribe({
                    next: (results) => {
                        this.onSearchOSPActiveRoles(results, party, identityRef);
                    }
                });

            } else {
                // no identity found
                this.addGlobalMessages(['Cannot match ABN']);
            }

        }

    }

    public onSearchOSPActiveRoles(results: ISearchResult<IHrefValue<IRole>>, party: IParty, abnIdentityRef: IHrefValue<IIdentity>) {
        for (let role of results.list) {
            if (role.value.roleType.href.endsWith(Constants.RoleTypeCode.OSP)) {
                this.ospRoleRef = role;
                this.delegateParty = party;
                this.delegateIdentityRef = abnIdentityRef;
                this.ospServices = this.services.model.getAccessibleAgencyServiceRoleAttributeNames(role, []);
                return;
            }
        }
        this.addGlobalMessages(['The business matching the ABN is not a registered Online Service Provider']);
    }

    public onAgencyServiceChange(attributeCode: string) {
        let agencyServices = this.form.controls['agencyServices'].value;
        let index = agencyServices.indexOf(attributeCode);
        if (index === -1) {
            agencyServices.push(attributeCode);
        } else {
            agencyServices.splice(index, 1);
        }
    }

    public isAgencyServiceSelected(code: string) {
        return this.form.controls['agencyServices'].value.indexOf(code) > -1;
    }

    public getSSIDs(): string[] {
        return this.getSSIDFormArray().value;
    }

    public addAnotherSSID() {
        this.getSSIDFormArray().push(this.fb.control(null, Validators.required));
    }

    public removeSSID() {
        const ssids = this.getSSIDFormArray();
        ssids.removeAt(ssids.length - 1);
    }

    public getSSIDFormArray() {
        return this.form.controls['ssids'] as FormArray;
    }

}
