import {OnInit, Input, Output, EventEmitter, Component} from '@angular/core';
import {REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup, FORM_DIRECTIVES } from '@angular/forms';
import {RAMNgValidators} from   '../../commons/ram-ng-validators';
import {MarkdownComponent} from '../ng2-markdown/ng2-markdown.component';

@Component({
    selector: 'relationship-declaration',
    templateUrl: 'relationship-declaration.component.html',
    directives: [REACTIVE_FORM_DIRECTIVES,FORM_DIRECTIVES, MarkdownComponent]
})
export class RelationshipDeclarationComponent implements OnInit {

    @Input('markdown') public markdown: string;
    @Input('data') public data: DeclarationComponentData;

    @Output('dataChange') public dataChanges = new EventEmitter<DeclarationComponentData>();
    @Output('isValid') public isValid = new EventEmitter<boolean>();

    public form: FormGroup;

    constructor(private _fb: FormBuilder) {
    }

    public ngOnInit() {

        this.form = this._fb.group({
            'accepted': [false, RAMNgValidators.mustBeTrue]
        });

        this.form.valueChanges.subscribe((v: DeclarationComponentData) => {
            this.dataChanges.emit(v);
            this.isValid.emit(this.form.valid);
        });

        // emit initial valid
        this.isValid.emit(this.form.valid);

    }

}

export interface DeclarationComponentData {
    accepted: boolean;
}
