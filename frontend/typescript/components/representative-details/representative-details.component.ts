import {Input, Output, EventEmitter, Component} from '@angular/core';
import {
    IndividualRepresentativeDetailsComponent,
    IndividualRepresentativeDetailsComponentData
} from './individual-representative-details/individual-representative-details.component';
import {
    OrganisationRepresentativeDetailsComponent,
    OrganisationRepresentativeDetailsComponentData
} from './organisation-representative-details/organisation-representative-details.component';

@Component({
    selector: 'representative-details',
    templateUrl: 'representative-details.component.html',
    directives: [
        IndividualRepresentativeDetailsComponent,
        OrganisationRepresentativeDetailsComponent
    ]
})

export class RepresentativeDetailsComponent {

    @Input('data') public data: RepresentativeDetailsComponentData;

    @Output('dataChange') public dataChanges = new EventEmitter<RepresentativeDetailsComponentData>();
    @Output('isValid') public isValid = new EventEmitter<boolean>();

    public emitIndividualValidStatus(valid: boolean) {
        if (!this.isOrganisation()) {
            this.isValid.emit(valid);
        }
    }

    public emitOrganisationValidStatus(valid: boolean) {
        if (this.isOrganisation()) {
            this.isValid.emit(valid);
        }
    }

    public toggleIndividual() {
        this.data.organisation = undefined;
        this.data.individual = {
            givenName: '',
            familyName: '',
            dob: null
        };
    }

    public toggleOrganisation() {
        this.data.individual = undefined;
        this.data.organisation = {
            abn: '',
            organisationName: ''
        };
    }

    public isDisabled(): boolean {
        return this.data.readOnly;
    }

    public isOrganisation(): boolean {
        return this.data && this.data.organisation !== null && this.data.organisation !== undefined;
    }

}

export interface RepresentativeDetailsComponentData {
    readOnly: boolean;
    showDob: boolean;
    individual?: IndividualRepresentativeDetailsComponentData;
    organisation?: OrganisationRepresentativeDetailsComponentData;
}
