import {OnInit, OnChanges, Input, Output, EventEmitter, Component, SimpleChanges} from '@angular/core';
import {Validators, FormBuilder, FormControl, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES} from '@angular/forms';
import {SimpleForm, SimpleFormControl} from '../../commons/form';
import {IRelationshipType, IHrefValue} from '../../../../commons/api';
import {CodeDecode} from '../../../../commons/dtos/codeDecode.dto';

@Component({
    selector: 'authorisation-type',
    templateUrl: 'authorisation-type.component.html',
    directives: [REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES]
})

export class AuthorisationTypeComponent implements OnInit, OnChanges {

    public form: SimpleForm<AuthorisationTypeComponentData>;

    @Input('data') public data: AuthorisationTypeComponentData;
    @Input('options') public options: IHrefValue<IRelationshipType>[];

    @Output('dataChange') public dataChanges = new EventEmitter<AuthorisationTypeComponentData>();
    @Output('isValid') public isValid = new EventEmitter<boolean>();

    constructor(private fb: FormBuilder) {
        this.form = new SimpleForm<AuthorisationTypeComponentData>(this.fb);
    }

    public ngOnInit() {

        // auth type control
        this.form.add(new SimpleFormControl('authType')
            .value(this.data.authType ? this.data.authType.value.code : '-')
            .validator(Validators.compose([this.isAuthTypeSelected]))
            .transformer((code: string) => {
                return this.getRefByCode(code);
            })
        );

        // emit events
        this.form.onChange((data: AuthorisationTypeComponentData) => {
            this.dataChanges.emit(data);
            this.isValid.emit(this.form.isValid());
        });

        // emit initial valid
        this.isValid.emit(this.form.isValid());

    }

    public ngOnChanges(changes: SimpleChanges): any {
        this.form.updateValue('authType', this.data.authType ? this.data.authType.value.code : '-');
    }

    public onAuthTypeChange(code: string) {
        this.data.authType = this.getRefByCode(code);
    }

    private getRefByCode(code: string) {
        return CodeDecode.getRefByCode(this.options, code) as IHrefValue<IRelationshipType>;
    }

    private isAuthTypeSelected = (control: FormControl) => {
        return (control.value === '-') ? {authorisationTypeNotSet: {valid: false}} : null;
    };

}

export interface AuthorisationTypeComponentData {
    authType: IHrefValue<IRelationshipType>;
}
