import {FormBuilder, FormGroup, FormControl, ValidatorFn, AsyncValidatorFn} from '@angular/forms';

export class SimpleForm<T> {

    private group: FormGroup;
    private controls: {[key: string]: SimpleFormControl} = {};
    private onChangeFn: (value: T) => void;

    constructor(public fb: FormBuilder) {

        // start with an empty form group
        this.group = fb.group({});

        // subscribe to changes and transform the model before notifying
        this.group.valueChanges.subscribe((model: {[key: string]: any}) => {
            let transformedModel: T = {} as T;
            for (let key of Object.keys(model)) {
                let control = this.controls[key];
                let transformerFn = control ? control.transformerFn : undefined;
                let value: any = model[key];
                transformedModel[key] = transformerFn ? transformerFn(value) : value;
            }
            if (this.onChangeFn) {
                this.onChangeFn(transformedModel);
            }
        });

    }

    public add(control: SimpleFormControl): SimpleForm<T> {
        this.group.addControl(control.name, control.ngControl);
        this.controls[control.name] = control;
        return this;
    }

    public remove(name: string): SimpleForm<T> {
        this.group.removeControl(name);
        this.controls[name] = undefined;
        return this;
    }

    public onChange(onChangeFn: (value: T) => void): SimpleForm<T> {
        this.onChangeFn = onChangeFn;
        return this;
    }

    public updateValue(name: string, value: string|number|boolean): SimpleForm<T> {
        let control = this.controls[name];
        if (control) {
            control.updateValue(value);
        }
        return this;
    }

    public isValid(): boolean {
        return this.group.valid;
    }

}

export class SimpleFormControl {

    public transformerFn: (value: string|number|boolean) => any;
    public ngControl: FormControl;

    constructor(public name: string) {
        this.ngControl = new FormControl('', null);
    }

    public value(value: string|number|boolean) {
        this.updateValue(value);
        return this;
    }

    public validator(validator: ValidatorFn | ValidatorFn[]) {
        this.ngControl.setValidators(validator);
        return this;
    }

    public asyncValidator(validator: AsyncValidatorFn | AsyncValidatorFn[]) {
        this.ngControl.setAsyncValidators(validator);
        return this;
    }

    public transformer(transformerFn: (value: string|number|boolean) => any) {
        this.transformerFn = transformerFn;
        return this;
    }

    public updateValue(value: string|number|boolean) {
        this.ngControl.updateValue(value);
    }

}