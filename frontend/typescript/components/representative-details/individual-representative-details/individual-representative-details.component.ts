import {OnInit, OnChanges, Input, Output, EventEmitter, Component, SimpleChanges} from '@angular/core';
import {
    Validators,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    FORM_DIRECTIVES
} from '@angular/forms';
import {RAMNgValidators} from '../../../commons/ram-ng-validators';
import {Calendar} from 'primeng/primeng';

@Component({
    selector: 'individual-representative-details',
    templateUrl: 'individual-representative-details.component.html',
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Calendar]
})

export class IndividualRepresentativeDetailsComponent implements OnInit, OnChanges {

    public form: FormGroup;
    public dateFormat: string = 'dd/mm/yy';

    @Input('readOnly') public readOnly: boolean;
    @Input('showDob') public showDob: boolean;
    @Input('data') public data: IndividualRepresentativeDetailsComponentData;

    @Output('dataChange') public dataChanges = new EventEmitter<IndividualRepresentativeDetailsComponentData>();
    @Output('isValid') public isValid = new EventEmitter<boolean>();

    constructor(private _fb: FormBuilder) {
    }

    public ngOnInit() {

        this.form = this._fb.group({
            'givenName': [this.data ? this.data.givenName : '', Validators.required],
            'familyName': [this.data ? this.data.familyName : ''],
            'dob': [this.data ? this.data.dob : '', Validators.compose([RAMNgValidators.dateFormatValidator])]
        });

        this.form.valueChanges.subscribe((v: IndividualRepresentativeDetailsComponentData) => {
            this.dataChanges.emit(v);
            this.isValid.emit(this.form.valid);
        });

        // emit initial valid
        this.isValid.emit(this.form.valid);

    }

    public ngOnChanges(changes: SimpleChanges): any {
        if (this.form) {
            (this.form.controls['givenName'] as FormControl).updateValue(this.data.givenName);
            (this.form.controls['familyName'] as FormControl).updateValue(this.data.familyName);
            if (this.data.dob) {
                (this.form.controls['dob'] as FormControl).updateValue(this.data.dob);
            }
        }
        return undefined;
    }

    public isDisabled() {
        return this.readOnly;
    }

}

export interface IndividualRepresentativeDetailsComponentData {
    givenName: string;
    familyName?: string;
    dob?: Date;
}