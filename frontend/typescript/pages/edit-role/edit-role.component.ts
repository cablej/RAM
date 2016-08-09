import {Observable} from 'rxjs/Rx';
import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup, FORM_DIRECTIVES, FormControl} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {
    SearchResultPaginationComponent, SearchResultPaginationDelegate
}
    from '../../components/search-result-pagination/search-result-pagination.component';
import {RAMServices} from '../../services/ram-services';

import {
    IHrefValue,
    FilterParams,
    ISearchResult,
    IAgencyUser,
    IIdentity,
    Role,
    RoleAttribute,
    IRole,
    IRoleType,
    IRoleAttributeNameUsage,
    IRoleAttribute,
    IAUSkey
} from '../../../../commons/RamAPI';

@Component({
    selector: 'ram-edit-role',
    templateUrl: 'edit-role.component.html',
    directives: [
        REACTIVE_FORM_DIRECTIVES,
        FORM_DIRECTIVES,
        ROUTER_DIRECTIVES,
        PageHeaderAuthComponent,
        SearchResultPaginationComponent
    ]
})

export class EditRoleComponent extends AbstractPageComponent {

    public identityHref: string;
    public roleHref: string;

    public auskeyFilter: FilterParams;
    public auskeyPage: number;
    public auskeyPaginationDelegate: SearchResultPaginationDelegate;

    public giveAuthorisationsEnabled: boolean = true; // todo need to set this
    public me: IAgencyUser;
    public identity: IIdentity;
    public role: IRole;
    public roleTypeRefs: IHrefValue<IRoleType>[];
    public agencyServiceRoleAttributeNameUsages: IRoleAttributeNameUsage[];
    public deviceAusKeyRefs$: Observable<ISearchResult<IHrefValue<IAUSkey>>>;

    public form: FormGroup;

    private _isLoading = false; // set to true when you want the UI indicate something is getting loaded.

    constructor(route: ActivatedRoute,
                router: Router,
                services: RAMServices,
                private _fb: FormBuilder) {
        super(route, router, services);
        this.setBannerTitle('Authorisations');
    }

    public onInit(params: {path: Params, query: Params}) {

        this._isLoading = true;

        // forms
        this.form = this._fb.group({
            roleType: '-',
            preferredName: '',
            agencyServices: [[]],
            deviceAusKeys: [[]]
        });

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.roleHref = params.path['roleHref'];

        this.auskeyFilter = FilterParams.decode(params.query['auskeyFilter']);
        this.auskeyPage = params.query['auskeyPage'] ? +params.query['auskeyPage'] : 1;

        // restrict to device auskeys
        this.auskeyFilter.add('auskeyType', this.services.constants.AUSkey.DEVICE_TYPE);

        // me (agency user)
        this.services.rest.findMyAgencyUser().subscribe((me) => {
            this.me = me;
        }, (err) => {
            const status = err.status;
            if (status === 401 || status === 403) {
                this.services.route.goToAccessDeniedPage();
            }
        });

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe((identity) => {

            this.identity = identity;

            // pagination delegate
            // todo code below doesn't look right
            this.auskeyPaginationDelegate = {
                goToPage: (page: number) => {
                    this.deviceAusKeyRefs$ = this.services.rest.listAusKeys(this.identity.idValue, this.auskeyFilter.encode(), page);
                }
            } as SearchResultPaginationDelegate;
            this.auskeyPaginationDelegate.goToPage(1);

            // role in focus
            if (this.roleHref) {
                this.services.rest.findRoleByHref(this.roleHref).subscribe((role) => {
                    this.role = role;

                    this.services.rest.findRelationshipTypeByHref(role.roleType.href).subscribe((roleType) => {
                        (<FormControl>this.form.controls['roleType']).updateValue(roleType.code);
                        this.onRoleTypeChange(roleType.code);
                    });

                    (this.form.controls['preferredName'] as FormControl).updateValue(this.services.model.getRoleAttribute(role, 'PREFERRED_NAME', 'OTHER').value[0]);
                    (this.form.controls['deviceAusKeys'] as FormControl).updateValue(this.services.model.getRoleAttribute(role, 'DEVICE_AUSKEYS', 'OTHER').value);

                    const agencyAttributes = this.services.model.getRoleAttributesByClassifier(role, 'AGENCY_SERVICE');
                    for(let attr of agencyAttributes) {
                        if(attr.value[0] === 'true') {
                            this.onAgencyServiceChange(attr.attributeName.value.code);
                        }
                    }
                }, (err) => {
                    this.addGlobalMessages(this.services.rest.extractErrorMessages(err));
                });
            }
        }, (err) => {
            this.addGlobalMessages(this.services.rest.extractErrorMessages(err));
        });

        // role types
        this.services.rest.listRoleTypes().subscribe((roleTypeRefs) => {
            this.roleTypeRefs = roleTypeRefs;
        });

    }

    public onRoleTypeChange(newRoleTypeCode: string) {
        if (this.me) {
            this.form.controls['agencyServices'].updateValueAndValidity([]);
            let roleTypeRef: IHrefValue<IRoleType> = this.services.model.getRoleTypeRef(this.roleTypeRefs, newRoleTypeCode);
            const programs: string[] = [];
            for (let programRole of this.me.programRoles) {
                if (programRole.role === 'ROLE_ADMIN') {
                    if (programs.indexOf(programRole.program) === -1) {
                        programs.push(programRole.program);
                    }
                }
            }
            if (roleTypeRef) {
                this.agencyServiceRoleAttributeNameUsages = this.services.model.getAccessibleAgencyServiceRoleAttributeNameUsages(roleTypeRef, programs);
            }
        }
    }

    public onAgencyServiceChange(attributeCode: string) {
        this.toggleArrayValue(this.form.controls['agencyServices'].value, attributeCode);
    }

    public onAusKeyChange(auskey: string) {
        this.toggleArrayValue(this.form.controls['deviceAusKeys'].value, auskey);
    }

    public isAusKeySelected(auskey: string) {
        return this.form.controls['deviceAusKeys'].value.indexOf(auskey) > -1;
    }

    public isAgencyServiceSelected(code: string) {
        return this.form.controls['agencyServices'].value.indexOf(code) > -1;
    }

    private toggleArrayValue(arr: string[], val: string) {
        let index = arr.indexOf(val);
        if (index === -1) {
            arr.push(val);
        } else {
            arr.splice(index, 1);
        }
    }

    public back() {
        this.services.route.goToRolesPage(this.identityHref);
    }

    public save() {
        this.clearGlobalMessages();
        const roleTypeCode = this.form.controls['roleType'].value;
        const agencyServiceCodes = this.form.controls['agencyServices'].value;
        const preferredName = this.form.controls['preferredName'].value;
        const deviceAusKeys = this.form.controls['deviceAusKeys'].value;
        if (!roleTypeCode || roleTypeCode === '-') {
            this.addGlobalMessage('Please select a role type.');
        } else if (!this.agencyServiceRoleAttributeNameUsages || this.agencyServiceRoleAttributeNameUsages.length === 0) {
            this.addGlobalMessage('You do not have access to any government services.');
        } else if (agencyServiceCodes.length === 0) {
            this.addGlobalMessage('Please select at least one government agency service.');
        } else {
            let roleTypeRef: IHrefValue<IRoleType> = this.services.model.getRoleTypeRef(this.roleTypeRefs, roleTypeCode);
            let attributes: RoleAttribute[] = [];
            attributes.push(new RoleAttribute(preferredName, this.services.model.getRoleTypeAttributeNameRef(roleTypeRef, 'PREFERRED_NAME')));
            attributes.push(new RoleAttribute(deviceAusKeys, this.services.model.getRoleTypeAttributeNameRef(roleTypeRef, 'DEVICE_AUSKEYS')));
            for (let agencyServiceCode of agencyServiceCodes) {
                attributes.push(new RoleAttribute('true', this.services.model.getRoleTypeAttributeNameRef(roleTypeRef, agencyServiceCode)));
            }
            const role = new Role(
                [],
                null,
                roleTypeRef,
                this.identity.party,
                new Date(),
                null,
                null,
                new Date(),
                'ACTIVE',
                attributes
            );
            // todo replace with href
            this.services.rest.createRole(role).subscribe((role) => {
                // todo replace with href
                this.services.route.goToRolesPage(this.identityHref);
            }, (err) => {
                this.addGlobalMessages(this.services.rest.extractErrorMessages(err));
            });
        }
    }

}
