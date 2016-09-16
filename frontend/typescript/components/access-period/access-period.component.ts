import {OnInit, Input, Output, EventEmitter, Component} from '@angular/core';
import {
    Validators,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    FORM_DIRECTIVES
} from '@angular/forms';
import {Utils} from '../../../../commons/utils';
import {RAMNgValidators} from '../../commons/ram-ng-validators';
import {Calendar} from 'primeng/primeng';

@Component({
    selector: 'access-period',
    templateUrl: 'access-period.component.html',
    directives: [REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, Calendar]
})
export class AccessPeriodComponent implements OnInit {

    public form: FormGroup;
    public dateFormat: string = 'dd/mm/yy';

    @Input('originalStartDate') public originalStartDate: Date;
    @Input('data') public data: AccessPeriodComponentData;

    @Output('dataChange') public dataChanges = new EventEmitter<AccessPeriodComponentData>();

    @Output('isValid') public isValid = new EventEmitter<boolean>();

    constructor(private _fb: FormBuilder) {
    }

    public ngOnInit() {

        const startDate = this.data.startDate;
        const endDate = this.data.endDate;
        const formattedStartDate: string = this.formatDate(startDate);
        const formattedEndDate: string = this.formatDate(endDate);

        this.form = this._fb.group(
            {
                'startDateEnabled': [this.data.startDateEnabled],
                'startDate': [formattedStartDate, Validators.compose([Validators.required, RAMNgValidators.dateFormatValidator, this.dateNotInPastValidator.bind(this)])],
                'endDate': [formattedEndDate, Validators.compose([RAMNgValidators.dateFormatValidator])],
                'noEndDate': [this.data.noEndDate]
            },
            {
                validator: Validators.compose([this._isDateBefore('startDate', 'endDate')])
            }
        );

        let noEndDate = this.form.controls['noEndDate'];

        noEndDate.valueChanges.subscribe((v: Boolean) => {
            if (v === true) {
                // reset endDate if noEndDate checkbox is selected
                ( this.form.controls['endDate'] as FormControl).updateValue(null);
            }
        });

        this.form.valueChanges.subscribe((v: AccessPeriodComponentData) => {
            v.startDate = Utils.parseDate(v.startDate);
            v.endDate = Utils.parseDate(v.endDate);
            this.dataChanges.emit(v);
            this.isValid.emit(this.form.valid)  ;
        });

        // emit initial valid
        this.isValid.emit(this.form.valid);

    }

    public dateNotInPastValidator(dateCtrl: FormControl) {
        // valid
        if (!this.data.startDateEnabled) {
            return null;
        }
        // valid
        if (this.dateIsOriginalOrTodayOrInFuture(dateCtrl.value)) {
            return null;
        }
        // invalid
        return {
            startDateInPast: {
                valid: false
            }
        };
    }

    private dateIsOriginalOrTodayOrInFuture(ctrlValue: string | Date) {
        if (ctrlValue) {
            const date = Utils.parseDate(ctrlValue);
            if (Utils.dateIsTodayOrInFuture(date) || date.getTime() === this.originalStartDate.getTime()) {
                return true;
            }
        }
        return false;
    }

    private formatDate(d: Date) {
        return d === null || d === undefined ? null : ('0' + d.getDate()).slice(-2) + '/' + ('0'+(d.getMonth()+1)).slice(-2) + '/' + d.getFullYear();
    }

    private _isDateBefore = (startDateCtrlName: string, endDateCtrlName: string) => {
        return (cg: FormGroup) => {
            let startDate = Utils.parseDate((cg.controls[startDateCtrlName] as FormControl).value);
            let endDate = Utils.parseDate((cg.controls[endDateCtrlName] as FormControl).value);
            return (startDate !== null && endDate !== null && startDate.getTime() > endDate.getTime()) ? {
                isEndDateBeforeStartDate: {
                    valid: false
                }
            } : null;
        };
    };

}

export interface AccessPeriodComponentData {
    startDateEnabled: boolean;
    startDate: Date;
    endDate?: Date;
    noEndDate: boolean;
}
