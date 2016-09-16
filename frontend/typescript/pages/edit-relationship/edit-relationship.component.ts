import {Component, ChangeDetectorRef} from '@angular/core';
import {ROUTER_DIRECTIVES, Router, ActivatedRoute, Params} from '@angular/router';
import {FormBuilder} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {AccessPeriodComponent, AccessPeriodComponentData} from '../../components/access-period/access-period.component';
import {
    AuthorisationPermissionsComponent,
    AuthorisationPermissionsComponentData
} from '../../components/authorisation-permissions/authorisation-permissions.component';
import {
    AuthorisationTypeComponent,
    AuthorisationTypeComponentData
} from '../../components/authorisation-type/authorisation-type.component';
import {
    RelationshipDeclarationComponent, DeclarationComponentData
} from '../../components/relationship-declaration/relationship-declaration.component';
import {
    RepresentativeDetailsComponent, RepresentativeDetailsComponentData
} from
    '../../components/representative-details/representative-details.component';
import {
    AuthorisationManagementComponent,
    AuthorisationManagementComponentData
} from '../../components/authorisation-management/authorisation-management.component';

import {
    IIdentity,
    Identity,
    IRelationshipAttributeNameUsage,
    IRelationshipType,
    IRelationship,
    Relationship,
    Party,
    Profile,
    Name,
    SharedSecret,
    SharedSecretType,
    IHrefValue,
    HrefValue,
    IRelationshipAttribute,
    RelationshipAttribute
} from '../../../../commons/api';
import {
    RelationshipCanViewPermission,
    RelationshipCanViewDobPermission, RelationshipCanEditDelegatePermission
} from '../../../../commons/permissions/relationshipPermission.templates';

@Component({
    selector: 'edit-relationship',
    templateUrl: 'edit-relationship.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        AccessPeriodComponent,
        AuthorisationPermissionsComponent,
        AuthorisationTypeComponent,
        RelationshipDeclarationComponent,
        RepresentativeDetailsComponent,
        AuthorisationManagementComponent,
        PageHeaderAuthComponent
    ]
})

export class EditRelationshipComponent extends AbstractPageComponent {

    private changeDetectorRef: ChangeDetectorRef;

    public identityHref: string;
    public relationshipHref: string;

    public relationshipTypeRefs: IHrefValue<IRelationshipType>[];
    public permissionAttributeUsagesByType: { [relationshipTypeCode: string]: IRelationshipAttributeNameUsage[] } = {};
    public permissionAttributeUsages: IRelationshipAttributeNameUsage[];

    public identity: IIdentity;
    public relationship: IRelationship;
    public manageAuthAttribute: IRelationshipAttributeNameUsage;

    public authType: string = 'choose';
    public disableAuthMgmt: boolean = true;
    public originalStartDate: Date = null;

    public relationshipComponentData: EditRelationshipComponentData = {
        accessPeriod: {
            startDateEnabled: true,
            startDate: new Date(),
            noEndDate: true,
            endDate: null
        },
        authType: {
            authType: null
        },
        representativeDetails: {
            readOnly: true,
            showDob: false,
            individual: {
                givenName: '',
                familyName: '',
                dob: null
            },
            organisation: undefined
        },
        authorisationManagement: {
            value: 'false'
        },
        permissionAttributes: [],
        authorisationPermissions: {
            value: '',
            customisationEnabled: false,
            accessLevelsDescription: null,
            enabled: false
        },
        declaration: {
            accepted: false
        }
    };

    public declarationText: string;

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices, cdr: ChangeDetectorRef) {
        super(route, router, fb, services);
        this.setBannerTitle('Authorisations');
        this.changeDetectorRef = cdr;
    }

    public onInit(params: {path: Params, query: Params}) {

        this.identityHref = params.path['identityHref'];
        this.relationshipHref = params.path['relationshipHref'];

        // relationship types
        this.services.rest.listRelationshipTypes().subscribe({
            next: this.onListRelationshipTypes.bind(this),
            error: this.onServerError.bind(this)
        });

    }

    public onListRelationshipTypes(relationshipTypeRefs: IHrefValue<IRelationshipType>[]) {

        // filter the relationship types to those that can be chosen here
        this.relationshipTypeRefs = relationshipTypeRefs.filter((relationshipType) => {
            return !relationshipType.value.getAttributeName(Constants.RelationshipAttributeNameCode.MANAGED_EXTERNALLY_IND)
                && relationshipType.value.category === Constants.RelationshipTypeCategory.AUTHORISATION;
        });
        this.resolveAttributeUsages();

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });

    }

    public onFindIdentity(identity: IIdentity) {

        this.identity = identity;

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

    // todo refactor to use this.relationship
    public onFindRelationship(relationship: IRelationship) {

        this.relationship = relationship;

        // ensure authorisation type is supported
        const relationshipType = this.relationship.relationshipType.getFromList(this.relationshipTypeRefs);
        if (!relationshipType) {
            this.services.route.goToRelationshipsPage(this.identityHref);
        } else {

            // representative details
            this.updateRepresentativeDetails();

            // access period
            this.relationshipComponentData.accessPeriod = {
                startDate: relationship.startTimestamp,
                endDate: relationship.endTimestamp,
                noEndDate: relationship.endTimestamp === undefined || relationship.endTimestamp === null,
                startDateEnabled: true
            };
            this.originalStartDate = relationship.startTimestamp;

            // auth type
            this.relationshipComponentData.authType = {
                authType: relationshipType
            };
            this.authTypeChange(this.relationshipComponentData.authType);

            // auth management
            const userAuthorisedToManage = this.relationship.getAttribute(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND).value[0];
            this.relationshipComponentData.authorisationManagement = {
                value: userAuthorisedToManage
            };

            // access levels
            for (let permissionAttribute of this.relationshipComponentData.permissionAttributes) {
                const existingAttribute = this.getExistingAttributeWithCode(permissionAttribute.attributeName.value.code);
                if (existingAttribute && existingAttribute.value) {
                    permissionAttribute.value = existingAttribute.value;
                }
            }

        }

    }

    private getExistingAttributeWithCode(code: string): IRelationshipAttribute {
        for (let att of this.relationship.attributes) {
            if (att.attributeName.value.code === code) {
                return att;
            }
        }
        return null;
    }

    // todo refactor to use this
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

        this.originalStartDate = this.relationshipComponentData.accessPeriod.startDate;

        // representative details
        this.updateRepresentativeDetails();

        // declaration
        this.updateDeclarationText(null);

    }

    public updateRepresentativeDetails() {

        // name, dob, abn
        const delegate = this.relationship.delegate ? this.relationship.delegate.value : undefined;
        let delegateFirstIdentityRef = delegate ? delegate.identities[0] : undefined;
        const profile = delegate ? delegateFirstIdentityRef.value.profile : undefined;
        const isOrganisation = delegate ? delegate.partyType === Constants.PartyTypeCode.ABN : false;

        // note - shared secrets are currently not returned - so the dob can not be populated!
        const dobSharedSecret = profile ? profile.getSharedSecret(Constants.SharedSecretCode.DATE_OF_BIRTH) : undefined;

        this.relationshipComponentData.representativeDetails = {
            readOnly: !this.relationship.isPermissionAllowed([RelationshipCanEditDelegatePermission]),
            showDob: this.relationship.isPermissionAllowed([RelationshipCanViewDobPermission]),
            individual: !isOrganisation ? {
                givenName: profile ? profile.name.givenName : '',
                familyName: profile ? profile.name.familyName : '',
                dob: !dobSharedSecret ? null : new Date(dobSharedSecret.value)
            } : undefined,
            organisation: isOrganisation ? {
                abn: delegateFirstIdentityRef ? delegateFirstIdentityRef.value.rawIdValue : '',
                organisationName: profile ? profile.name.unstructuredName : ''
            } : undefined
        };

    }

    public updateDeclarationText(relationshipTypeRef: IHrefValue<IRelationshipType>) {

        // TODO calculate declaration markdown based on relationship type AND services selected

        let markdown: string = null;

        if (relationshipTypeRef) {
            markdown = this.services.model.getRelationshipTypeAttributeNameUsage(relationshipTypeRef,
                Constants.RelationshipAttributeNameCode.SUBJECT_RELATIONSHIP_TYPE_DECLARATION).defaultValue;
        }

        this.relationshipComponentData.declaration = {
            accepted: false
        };

        this.declarationText = markdown;

    }

    public back() {
        this.services.route.goToRelationshipsPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity)
        );
    }

    public submit() {

        // save
        if (!this.relationshipHref) {

            // insert relationship

            let partyType = this.relationshipComponentData.representativeDetails.organisation ? Constants.PartyTypeCode.ABN : Constants.PartyTypeCode.INDIVIDUAL;
            let relationshipType = this.relationshipComponentData.authType.authType;

            // name
            let name = new Name(
                this.relationshipComponentData.representativeDetails.individual ? this.relationshipComponentData.representativeDetails.individual.givenName : undefined,
                this.relationshipComponentData.representativeDetails.individual ? this.relationshipComponentData.representativeDetails.individual.familyName : undefined,
                this.relationshipComponentData.representativeDetails.organisation ? this.relationshipComponentData.representativeDetails.organisation.organisationName : undefined,
                null
            );

            // dob
            let sharedSecrets: SharedSecret[] = [];
            if (this.relationshipComponentData.representativeDetails.individual) {
                let dob = this.relationshipComponentData.representativeDetails.individual.dob;
                if (dob) {
                    let dobSharedSecretType = new SharedSecretType(Constants.SharedSecretCode.DATE_OF_BIRTH, null, null, null, null, null);
                    sharedSecrets.push(new SharedSecret(dob.toString(), dobSharedSecretType));
                }
            }

            // profile
            let profile = new Profile(Constants.ProfileProviderCode.INVITATION, name, sharedSecrets);

            // identity
            let identityRef = new HrefValue<Identity>(null, new Identity(
                null,
                null,
                null,
                Constants.IdentityTypeCode.INVITATION_CODE,
                true,
                0,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                profile,
                null
            ));

            // delegate
            let delegateRef = new HrefValue(null, new Party(
                [],
                partyType,
                [identityRef]
            ));

            // meta
            this.relationship.relationshipType = relationshipType;
            this.relationship.delegate = delegateRef;
            this.relationship.startTimestamp = this.relationshipComponentData.accessPeriod.startDate;
            this.relationship.endTimestamp = this.relationshipComponentData.accessPeriod.endDate;
            this.relationship.endEventTimestamp = this.relationshipComponentData.accessPeriod.endDate;

            // delegate manage authorisation allowed attribute
            this.relationship.attributes = [
                new RelationshipAttribute(
                    [this.relationshipComponentData.authorisationManagement.value],
                    relationshipType.value.getAttributeNameRef(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND)
                )
            ];

            // permission attributes
            if (relationshipType.value.getAttributeNameUsage(Constants.RelationshipAttributeNameCode.PERMISSION_CUSTOMISATION_ALLOWED_IND)) {
                for (let permissionAttribute of this.relationshipComponentData.permissionAttributes) {
                    this.relationship.attributes.push(permissionAttribute);
                }
            }

            // invoke api
            let saveHref = this.services.model.getLinkHrefByType(Constants.Link.RELATIONSHIP_CREATE, this.identity);
            this.services.rest.insertRelationshipByHref(saveHref, this.relationship).subscribe({
                next: this.onInsert.bind(this),
                error: this.onServerError.bind(this)
            });

        } else {

            // update relationship

            let relationshipType = this.relationshipComponentData.authType.authType;
            let firstIdentityForDelegate = this.relationship.delegate.value.identities[0];
            let profile = firstIdentityForDelegate.value.profile;
            let name = profile.name;

            // meta
            this.relationship.relationshipType = relationshipType;
            this.relationship.startTimestamp = this.relationshipComponentData.accessPeriod.startDate;
            this.relationship.endTimestamp = this.relationshipComponentData.accessPeriod.endDate;
            this.relationship.endEventTimestamp = this.relationshipComponentData.accessPeriod.endDate;

            // name
            name.givenName = this.relationshipComponentData.representativeDetails.individual ? this.relationshipComponentData.representativeDetails.individual.givenName : undefined;
            name.familyName = this.relationshipComponentData.representativeDetails.individual ? this.relationshipComponentData.representativeDetails.individual.familyName : undefined;
            name.unstructuredName = this.relationshipComponentData.representativeDetails.organisation ? this.relationshipComponentData.representativeDetails.organisation.organisationName : undefined;

            // dob
            if (this.relationshipComponentData.representativeDetails.individual) {
                let dob = this.relationshipComponentData.representativeDetails.individual.dob;
                if (dob) {
                    let dobSharedSecretType = new SharedSecretType(Constants.SharedSecretCode.DATE_OF_BIRTH, null, null, null, null, null);
                    profile.insertOrUpdateSharedSecret(new SharedSecret(dob.toString(), dobSharedSecretType));
                } else {
                    profile.deleteSharedSecret(Constants.SharedSecretCode.DATE_OF_BIRTH);
                }
            }

            // delegate manage authorisation allowed attribute
            this.relationship.deleteAttribute(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND);
            this.relationship.attributes.push(new RelationshipAttribute(
                [this.relationshipComponentData.authorisationManagement.value],
                relationshipType.value.getAttributeNameRef(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND)
            ));

            // permission attributes
            // todo this needs to replace any existing permissions
            if (relationshipType.value.getAttributeNameUsage(Constants.RelationshipAttributeNameCode.PERMISSION_CUSTOMISATION_ALLOWED_IND)) {
                // remove existing permission attributes
                this.relationship.attributes = this.relationship.attributes.filter((att) => {
                    return att.attributeName.value.classifier !== Constants.RelationshipAttributeNameClassifier.PERMISSION;
                });
                // add new/changed ones
                for (let permissionAttribute of this.relationshipComponentData.permissionAttributes) {
                    this.relationship.attributes.push(permissionAttribute);
                }
            }

            // invoke api
            let saveHref = this.services.model.getLinkHrefByType(Constants.Link.MODIFY, this.relationship);
            this.services.rest.updateRelationshipByHref(saveHref, this.relationship).subscribe({
                next: this.onUpdate.bind(this),
                error: this.onServerError.bind(this)
            });

        }

    }

    public onInsert(relationship: IRelationship) {
        this.services.route.goToRelationshipAddCompletePage(
            this.identityHref,
            this.services.model.getLinkHrefByType(Constants.Link.SELF, relationship)
        );
    }

    public onUpdate(relationship: IRelationship) {
        if (this.relationship.getLinkHrefByPermission(RelationshipCanViewPermission) !== relationship.getLinkHrefByPermission(RelationshipCanViewPermission) && relationship.isPending()) {
            // created new superseding relationship requiring acceptance
            this.services.route.goToRelationshipAddCompletePage(
                this.identityHref,
                this.services.model.getLinkHrefByType(Constants.Link.SELF, relationship)
            );
        } else {
            // edited existing relationship that does not require acceptance
            this.services.route.goToRelationshipsPage(relationship.subject.value.identities[0].href);
        }
    }

    public resolveAttributeUsages() {
        for (let relTypeRef of this.relationshipTypeRefs) {
            const attributeNames = relTypeRef.value.relationshipAttributeNames;
            this.permissionAttributeUsagesByType[relTypeRef.value.code] = attributeNames.filter((attName) => {
                return attName.attributeNameDef.value.classifier === Constants.RelationshipAttributeNameClassifier.PERMISSION;
            });
        }
    }

    public displayName(repDetails: RepresentativeDetailsComponentData) {
        if (repDetails.organisation) {
            return repDetails.organisation.abn;
        } else {
            return repDetails.individual.givenName + (repDetails.individual.familyName ? ' ' + repDetails.individual.familyName : '');
        }
    }

    public authTypeChange = (data: AuthorisationTypeComponentData) => {

        // find the selected relationship type by code
        let selectedRelationshipTypeRef = data.authType;

        if (selectedRelationshipTypeRef) {

            const allowManageAuthorisationUsage = selectedRelationshipTypeRef.value.getAttributeNameUsage(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND);
            const canChangeManageAuthorisationUsage = selectedRelationshipTypeRef.value.getAttributeNameUsage(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_USER_CONFIGURABLE_IND);

            this.manageAuthAttribute = allowManageAuthorisationUsage;

            // authorisation permission component
            this.relationshipComponentData.authorisationPermissions.customisationEnabled = selectedRelationshipTypeRef.value.getAttributeNameUsage(Constants.RelationshipAttributeNameCode.PERMISSION_CUSTOMISATION_ALLOWED_IND).defaultValue !== 'false';
            this.relationshipComponentData.authorisationPermissions.enabled = true;
            this.relationshipComponentData.authorisationPermissions.accessLevelsDescription = selectedRelationshipTypeRef.value.getAttributeNameUsage(Constants.RelationshipAttributeNameCode.ACCESS_LEVELS_DESCRIPTION);

            // get the default value for the relationship type
            this.relationshipComponentData.authorisationManagement.value = allowManageAuthorisationUsage ? allowManageAuthorisationUsage.defaultValue : 'false';
            // allow editing of the value only if the DELEGATE_MANAGE_AUTHORISATION_USER_CONFIGURABLE_IND attribute is present on the relationship type
            this.disableAuthMgmt = canChangeManageAuthorisationUsage ? canChangeManageAuthorisationUsage === null : true;

            this.permissionAttributeUsages = this.permissionAttributeUsagesByType[selectedRelationshipTypeRef.value.code];

            // sort usages
            let orderedUsages = this.permissionAttributeUsages.slice();
            orderedUsages.sort((a, b) => {
                return a.sortOrder - b.sortOrder;
            });

            this.relationshipComponentData.permissionAttributes = [];
            for (let usage of orderedUsages) {
                let relationshipAttribute = new RelationshipAttribute(usage.defaultValue ? [usage.defaultValue] : [], usage.attributeNameDef);
                this.relationshipComponentData.permissionAttributes.push(relationshipAttribute);
            }

        } else {
            this.disableAuthMgmt = true;
        }

        // compute declaration
        this.updateDeclarationText(selectedRelationshipTypeRef);

    };

    public isAuthorizedBtnEnabled(): boolean {
        // return this.accessPeriodIsValid && authTypeIsValid && representativeIsValid;
        return true;
    }

}

export interface EditRelationshipComponentData {
    accessPeriod: AccessPeriodComponentData;
    authType: AuthorisationTypeComponentData;
    representativeDetails: RepresentativeDetailsComponentData;
    authorisationManagement: AuthorisationManagementComponentData;
    authorisationPermissions: AuthorisationPermissionsComponentData;
    permissionAttributes: IRelationshipAttribute[];
    declaration: DeclarationComponentData;
}