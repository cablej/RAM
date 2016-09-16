import {OnInit, Input, Output, EventEmitter, Component} from '@angular/core';
import {
    Validators,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    FORM_DIRECTIVES
} from '@angular/forms';
import {RAMRestService} from '../../../services/ram-rest.service';
import {RAMNgValidators} from '../../../commons/ram-ng-validators';
import {Observable} from 'rxjs/Observable';

@Component({
    selector: 'organisation-representative-details',
    templateUrl: 'organisation-representative-details.component.html',
    directives: [REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES]
})

export class OrganisationRepresentativeDetailsComponent implements OnInit {

    public form: FormGroup;

    public organisationName = '';

    public ABNNotValidMsg = 'ABN is not valid';

    @Input('readOnly') public readOnly: boolean;
    @Input('data') public data: OrganisationRepresentativeDetailsComponentData;

    @Output('dataChange') public dataChanges = new EventEmitter<OrganisationRepresentativeDetailsComponentData>();
    @Output('isValid') public isValid = new EventEmitter<boolean>();

    constructor(private _fb: FormBuilder, private rest: RAMRestService) {
    }

    public ngOnInit() {

        this.form = this._fb.group({
            'abn': [this.data ? this.data.abn : '', Validators.compose([Validators.required, RAMNgValidators.validateABNFormat])],
            'organisationName': [this.data ? this.data.organisationName : '']
        });

        this.form.valueChanges.subscribe((v: OrganisationRepresentativeDetailsComponentData) => {
            this.dataChanges.emit(v);
        });

        // emit initial valid
        this.isValid.emit(this.form.valid);

    }

    // operator has pressed "Check ABN" button
    public validateOrganisationName(abn: string) {
        // Rip of to a server to get company name
        this.rest.getOrganisationNameFromABN(abn)
            .catch((err: any, caught: Observable<string>) => {
                this.isValid.emit(false);
                this.organisationName = this.ABNNotValidMsg;
                return caught;
            }).subscribe((name: string) => {
            this.organisationName = name;
            this.isValid.emit(true);
        });
    }

    public clearOrganisationABN() {
        // All we need to do is clear controls to start again
        (this.form.controls['abn'] as FormControl).updateValue('');
        this.organisationName = '';
    }

    public isCompanyNameSet() {
        return this.organisationName !== '' && this.organisationName !== this.ABNNotValidMsg;
    }

    public isDisabled() {
        return this.isCompanyNameSet() || this.readOnly;
    }

}

export interface OrganisationRepresentativeDetailsComponentData {
    abn: string;
    organisationName: string;
}