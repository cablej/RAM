import {Component} from '@angular/core';
import {AccessPeriodComponent, AccessPeriodComponentData} from '../commons/access-period/access-period.component';
import {AuthorisationPermissionsComponent} from '../commons/authorisation-permissions/authorisation-permissions.component';
import {
    AuthorisationTypeComponent,
    AuthorisationTypeComponentData
} from '../commons/authorisation-type/authorisation-type.component';
import {DeclarationComponent, DeclarationComponentData} from '../commons/declaration/declaration.component';
import {
    RepresentativeDetailsComponent, RepresentativeDetailsComponentData
} from
    '../commons/representative-details/representative-details.component';
import {Router, RouteParams} from '@angular/router-deprecated';
import {RAMRestService} from '../../services/ram-rest.service';
import Rx from 'rxjs/Rx';
import {
    IAttributeDTO,
    ICreateIdentityDTO,
    IRelationshipAddDTO, IRelationshipAttributeNameUsage, IRelationshipType, IHrefValue
} from '../../../../commons/RamAPI2';
import {
    AuthorisationManagementComponent,
    AuthorisationManagementComponentData
} from '../commons/authorisation-management/authorisation-management.component';

@Component({
    selector: 'add-relationship',
    templateUrl: 'add-relationship.component.html',
    directives: [
        AccessPeriodComponent,
        AuthorisationPermissionsComponent,
        AuthorisationTypeComponent,
        DeclarationComponent,
        RepresentativeDetailsComponent,
        AuthorisationManagementComponent
    ]
})
export class AddRelationshipComponent {

    public idValue:string;
    public manageAuthAttribute:IRelationshipAttributeNameUsage;
    public relationshipTypes$:Rx.Observable<IHrefValue<IRelationshipType>[]>;

    public newRelationship:AddRelationshipComponentData = {
        accessPeriod: {
            startDate: null,
            noEndDate: true,
            endDate: null
        },
        authType: {
            authType: 'choose'
        },
        representativeDetails: {
            individual: {
                givenName: '',
                familyName: null,
                dob: null
            },
            organisation: {
                abn: ''
            }
        },
        authorisationManagement: {
            value: ''
        },
        decalaration: {
            accepted: false
        }
    };

    constructor(private routeParams:RouteParams,
                private router:Router,
                private rest:RAMRestService) {
    }

    public ngOnInit() {
        this.idValue = decodeURIComponent(this.routeParams.get('idValue'));
        // TODO implement as service - card #32
        this.relationshipTypes$ = this.rest.listRelationshipTypes();
        this.resolveManageAuthAttribute('UNIVERSAL_REPRESENTATIVE', 'DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND');
    }

    public back = () => {
        this.router.navigate(['Relationships', {idValue: this.idValue}]);
    };

    /* tslint:disable:max-func-body-length */
    public submit = () => {

        let delegate:ICreateIdentityDTO;

        if (this.newRelationship.representativeDetails.individual) {
            const dob = this.newRelationship.representativeDetails.individual.dob;
            delegate = {
                partyType: 'INDIVIDUAL',
                givenName: this.newRelationship.representativeDetails.individual.givenName,
                familyName: this.newRelationship.representativeDetails.individual.familyName,
                sharedSecretTypeCode: 'DATE_OF_BIRTH', // TODO: set to date of birth code
                sharedSecretValue: dob ? dob.toString() : ' ' /* TODO check format of date, currently sending x for space */,
                identityType: 'INVITATION_CODE',
                agencyScheme: undefined,
                agencyToken: undefined,
                linkIdScheme: undefined,
                linkIdConsumer: undefined,
                publicIdentifierScheme: undefined,
                profileProvider: undefined,
            };
        } else {
            /* TODO handle organisation delegate */
            alert('NOT YET IMPLEMENTED!');
            //delegate = {
            //    partyType: 'ABN',
            //    unstructuredName: '' ,
            //    identityType: 'PUBLIC_IDENTIFIER',
            //    publicIdentifierScheme: 'ABN',
            //    agencyToken: this.newRelationship.representativeDetails.organisation.abn // // TODO: where does the ABN value go?
            //};
        }

        const authorisationManagement:IAttributeDTO = {
            code: 'DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND',
            value: this.newRelationship.authorisationManagement.value
        };

        const relationship:IRelationshipAddDTO = {
            relationshipType: this.newRelationship.authType.authType,
            subjectIdValue: this.idValue /* TODO subject identity idValue */,
            delegate: delegate,
            startTimestamp: this.newRelationship.accessPeriod.startDate,
            endTimestamp: this.newRelationship.accessPeriod.endDate,
            attributes: [
                authorisationManagement
            ] /* TODO setting the attributes */
        };

        this.rest.createRelationship(relationship).subscribe((relationship) => {
            //console.log(JSON.stringify(relationship, null, 4));
            this.rest.findIdentityByHref(relationship.delegate.value.identities[0].href).subscribe((identity) => {
                //console.log(JSON.stringify(identity, null, 4));
                this.router.navigate(['AddRelationshipCompleteComponent', {
                    idValue: this.idValue,
                    invitationCode: identity.rawIdValue,
                    displayName: this.displayName(this.newRelationship.representativeDetails)
                }]);
            }, (err) => {
                // TODO
                alert(JSON.stringify(err, null, 2));
            });
        }, (err) => {
            // TODO
            alert(JSON.stringify(err, null, 2));
        });

    };

    public resolveManageAuthAttribute(relationshipTypeCode:string, attributeNameCode:string) {
        this.relationshipTypes$
            .subscribe(relationshipTypeHrefValues => {
                // find the relationship type
                const relationshipTypeHrefValue = relationshipTypeHrefValues.filter((relationshipTypeHrefValue) => {
                    return relationshipTypeHrefValue.value.code === relationshipTypeCode;
                });

                // find the attribute name
                let manageAuthAttributes = relationshipTypeHrefValue[0].value.relationshipAttributeNames
                    .filter((attributeName) => attributeName.attributeNameDef.value.code === attributeNameCode);
                if (manageAuthAttributes.length === 1) {
                    this.manageAuthAttribute = manageAuthAttributes[0];
                }
            });
    }

    public displayName(repDetails:RepresentativeDetailsComponentData) {
        if (repDetails.organisation) {
            return repDetails.organisation.abn;
        } else {
            return repDetails.individual.givenName + ' ' + repDetails.individual.familyName;
        }
    }

}

export interface AddRelationshipComponentData {
    accessPeriod:AccessPeriodComponentData;
    authType:AuthorisationTypeComponentData;
    representativeDetails:RepresentativeDetailsComponentData;
    authorisationManagement:AuthorisationManagementComponentData;
    decalaration:DeclarationComponentData;
}