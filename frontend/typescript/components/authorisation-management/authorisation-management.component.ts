import {Input, Component} from '@angular/core';
import {IRelationshipAttributeNameUsage} from '../../../../commons/api';

@Component({
    selector: 'authorisation-management',
    templateUrl: 'authorisation-management.component.html'
})
export class AuthorisationManagementComponent {

    @Input('disabled') public disabled:boolean;
    @Input('title') public title:string;
    @Input('data') public data:AuthorisationManagementComponentData;
    @Input('attributeNameUsage') public attributeNameUsage:IRelationshipAttributeNameUsage;

    public setCanManagePermissions(value:string) {
        this.data.value = value;
    }

    public isCanManagePermissionsSet() {
        return this.data.value;
    }

}

export interface AuthorisationManagementComponentData {
    value: string;
}