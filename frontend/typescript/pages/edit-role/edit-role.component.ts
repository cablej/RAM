import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup, FORM_DIRECTIVES, FormControl} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {
    SearchResultPaginationComponent, SearchResultPaginationDelegate
}
    from '../../components/search-result-pagination/search-result-pagination.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {
    IHrefValue,
    HrefValue,
    FilterParams,
    ISearchResult,
    IPrincipal,
    IIdentity,
    Role,
    RoleAttribute,
    IRole,
    IRoleType,
    IRoleAttributeNameUsage,
    IAUSkey,
    IRoleAttribute
} from '../../../../commons/api';

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

    public deviceAusKeyRefs: ISearchResult<IHrefValue<IAUSkey>>;

    public me: IPrincipal;
    public identity: IIdentity;
    public role: IRole;
    public roleTypeRefs: IHrefValue<IRoleType>[];
    public allAgencyServiceRoleAttributeNameUsages: IRoleAttributeNameUsage[]; // all agency services
    public accessibleAgencyServiceRoleAttributeNameUsages: IRoleAttributeNameUsage[]; // agency services that the user can manage
    public assignedAgencyAttributes: IRoleAttribute[] = []; // agency services assigned to the role
    public form: FormGroup;

    public hasServiceBeenRemoved: boolean = false;

    private _isLoading = false; // set to true when you want the UI indicate something is getting loaded.

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Authorisations');
    }

    public onInit(params: {path: Params, query: Params}) {

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.roleHref = params.path['roleHref'];

        this.auskeyFilter = FilterParams.decode(params.query['auskeyFilter']);
        this.auskeyPage = params.query['auskeyPage'] ? +params.query['auskeyPage'] : 1;

        // restrict to device auskeys
        this.auskeyFilter.add('auskeyType', Constants.AUSkey.DEVICE_TYPE);

        this._isLoading = true;

        // forms
        this.form = this.fb.group({
            roleType: '-',
            preferredName: '',
            agencyServices: [[]],
            deviceAusKeys: [[]],
            toggleAllAuskeys: false
        });

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.roleHref = params.path['roleHref'];

        this.auskeyFilter = FilterParams.decode(params.query['auskeyFilter']);
        this.auskeyPage = params.query['auskeyPage'] ? +params.query['auskeyPage'] : 1;

        // restrict to device auskeys
        this.auskeyFilter.add('auskeyType', Constants.AUSkey.DEVICE_TYPE);

        // me (agency user)
        this.services.rest.findMyPrincipal().subscribe({
            next: this.onFindMe.bind(this),
            error: this.onServerError.bind(this)
        });

        // role types
        this.services.rest.listRoleTypes().subscribe({
            next: (roleTypeRefs) => this.roleTypeRefs = roleTypeRefs,
            error: this.onServerError.bind(this)
        });
    }

    public onFindIdentity(identity: IIdentity) {

        this.identity = identity;

        // pagination delegate
        this.auskeyPaginationDelegate = {
            goToPage: (page: number) => {
                let href = this.services.model.getLinkHrefByType('auskey-list', this.identity);
                this.services.rest.searchAusKeysByHref(href, this.auskeyFilter.encode(), page).subscribe({
                    next: (auskeys) => this.deviceAusKeyRefs = auskeys,
                    error: this.onServerError.bind(this)
                });
            }
        } as SearchResultPaginationDelegate;

        this.auskeyPaginationDelegate.goToPage(1);

        // role in focus
        if (this.roleHref) {
            this.services.rest.findRoleByHref(this.roleHref).subscribe({
                next: this.onFindRole.bind(this),
                error: this.onServerError.bind(this)
            });
        } else {
            this.onNewRole();
        }
    }

    private onFindRole(role: IRole) {

        this.role = role;

        if (!this.services.model.hasLinkHrefByType(Constants.Link.MODIFY, this.role)) {
            // no modify access
            this.services.route.goToAccessDeniedPage();
        } else {
            // load relationship type
            this.services.rest.findRoleTypeByHref(role.roleType.href).subscribe({
                next: (roleType) => {
                    (this.form.controls['roleType'] as FormControl).updateValue(roleType.code);
                    // this.role.roleType.value = roleType;
                    this.onRoleTypeChange(roleType.code);
                },
                error: this.onServerError.bind(this)
            });
        }
    }

    private onFindMe(me: IPrincipal) {
        this.me = me;

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });
    }

    public onRoleTypeChange(newRoleTypeCode: string) {
        if (this.me) {
            this.form.controls['agencyServices'].updateValueAndValidity([]);
            let roleTypeRef: IHrefValue<IRoleType> = this.services.model.getRoleTypeRef(this.roleTypeRefs, newRoleTypeCode);

            this.role.roleType = roleTypeRef;
            const programs: string[] = [];

            if(this.me.agencyUserInd) {
                // agency users can select program roles
                for (let programRole of this.me.agencyUser.programRoles) {
                    if (programRole.role === 'ROLE_ADMIN') {
                        if (programs.indexOf(programRole.program) === -1) {
                            programs.push(programRole.program);
                        }
                    }
                }
            }

            if (roleTypeRef) {
                this.allAgencyServiceRoleAttributeNameUsages = this.services.model.getAllAgencyServiceRoleAttributeNameUsages(roleTypeRef, programs);
                this.accessibleAgencyServiceRoleAttributeNameUsages = this.services.model.getAccessibleAgencyServiceRoleAttributeNameUsages(roleTypeRef, programs);

                // if a role of this type already exists, then edit that otherwise we are adding a new role
                let filterParams = new FilterParams().add('roleType', roleTypeRef.value.code);
                const rolesHref = this.services.model.getLinkHrefByType(Constants.Link.ROLE_LIST, this.identity);

                this.services.rest.searchRolesByHref(rolesHref, filterParams.encode(), 1)
                    .subscribe((searchResult) => {
                        if (searchResult.totalCount === 1) {
                            this.role = searchResult.list[0].value;
                            this.role.roleType = roleTypeRef;
                            this.roleHref = this.services.model.getLinkHrefByType(Constants.Link.SELF, this.role);

                            this.setUpForm();
                        }
                        this._isLoading = false;
                    }, (err) => {
                        this.addGlobalErrorMessages(err);
                        this._isLoading = false;
                    });
            } else {
                this.role = null;
            }

        }
    }

    public onAgencyServiceChange(attributeCode: string) {
        this.toggleArrayValue(this.form.controls['agencyServices'].value, attributeCode);
        let hasServiceBeenRemoved = false;

        for (let attr of this.assignedAgencyAttributes) {
            if(this.form.controls['agencyServices'].value.indexOf(attr.attributeName.value.code) === -1) {
                hasServiceBeenRemoved = true;
                break;
            }
        }
        this.hasServiceBeenRemoved = hasServiceBeenRemoved;
    }

    public onAusKeyChange(auskey: string) {
        this.toggleArrayValue(this.form.controls['deviceAusKeys'].value, auskey);
    }

    public onNewRole() {
        this.role = new Role(
            [],
            null,
            null,
            new HrefValue(this.identity.party.href, null),
            null,
            null,
            null,
            null,
            null,
            []
        );
    }

    private setUpForm() {
        const preferredName = this.services.model.getRoleAttributeValue(this.services.model.getRoleAttribute(this.role, Constants.RoleAttributeNameCode.PREFERRED_NAME, Constants.RoleAttributeNameClassifier.OTHER));
        const deviceAusKeys = this.services.model.getRoleAttributeValue(this.services.model.getRoleAttribute(this.role, Constants.RoleAttributeNameCode.DEVICE_AUSKEYS, Constants.RoleAttributeNameClassifier.OTHER));
        (this.form.controls['preferredName'] as FormControl).updateValue(preferredName);
        (this.form.controls['deviceAusKeys'] as FormControl).updateValue(deviceAusKeys);
        this.updateAgencyServices();
    }

    private updateAgencyServices() {
        this.form.controls['agencyServices'].updateValueAndValidity([]);
        this.assignedAgencyAttributes = this.services.model.getRoleAttributesByClassifier(this.role, Constants.RoleAttributeNameClassifier.AGENCY_SERVICE);
        if (this.assignedAgencyAttributes) {
            for (let attr of this.assignedAgencyAttributes) {
                if (attr.value[0] === 'true') {
                    this.onAgencyServiceChange(attr.attributeName.value.code);
                }
            }
        }
    }

    public isAusKeySelected(auskey: string) {
        return this.form.controls['deviceAusKeys'].value.indexOf(auskey) > -1;
    }

    public isAgencyServiceSelected(code: string) {
        return this.form.controls['agencyServices'].value.indexOf(code) > -1;
    }

    public hasAccessToAgencyService(code: string) {
        for(let attr of this.accessibleAgencyServiceRoleAttributeNameUsages) {
            if(attr.attributeNameDef.value.code === code) {
                return true;
            }
        }
        return false;
    }

    public toggleAllAuskeys() {
        if (this.form.controls['toggleAllAuskeys'].value) {
            // toggle off
            const arr = this.form.controls['deviceAusKeys'].value;
            for (let val of this.deviceAusKeyRefs.list) {
                let index = arr.indexOf(val.value.id);
                if (index > -1) {
                    arr.splice(index, 1);
                }
            }
        } else {
            // toggle on
            const arr = this.form.controls['deviceAusKeys'].value;
            for (let val of this.deviceAusKeyRefs.list) {
                let index = arr.indexOf(val.value.id);
                if (index === -1) {
                    arr.push(val.value.id);
                }
            }
        }
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

        let validationOk = true;

        const roleTypeCode = this.form.controls['roleType'].value;
        const agencyServiceCodes = this.form.controls['agencyServices'].value;
        const preferredName = this.form.controls['preferredName'].value;
        const deviceAusKeys = this.form.controls['deviceAusKeys'].value;

        if (!roleTypeCode || roleTypeCode === '-') {
            validationOk = false;
            this.addGlobalMessage('Please select a role type.');
        }
        if (!this.accessibleAgencyServiceRoleAttributeNameUsages || this.accessibleAgencyServiceRoleAttributeNameUsages.length === 0) {
            validationOk = false;
            this.addGlobalMessage('You do not have access to any government services.');
        }

        // when CREATING a role, at least one agency service must be specified
        if (agencyServiceCodes.length === 0 && !this.roleHref) {
            validationOk = false;
            this.addGlobalMessage('Please select at least one government agency service.');
        }

        if (validationOk) {
            // let roleTypeRef: IHrefValue<IRoleType> = this.services.model.getRoleTypeRef(this.roleTypeRefs, roleTypeCode);
            let attributes: RoleAttribute[] = [];
            attributes.push(new RoleAttribute(preferredName, this.services.model.getRoleTypeAttributeNameRef(this.role.roleType, Constants.RoleAttributeNameCode.PREFERRED_NAME)));
            attributes.push(new RoleAttribute(deviceAusKeys, this.services.model.getRoleTypeAttributeNameRef(this.role.roleType, Constants.RoleAttributeNameCode.DEVICE_AUSKEYS)));

            for (let agencyServiceCode of agencyServiceCodes) {
                attributes.push(new RoleAttribute(['true'], this.services.model.getRoleTypeAttributeNameRef(this.role.roleType, agencyServiceCode)));
            }

            this.role.attributes = attributes;

            // save
            if(!this.roleHref) {

                // insert

                let saveHref = this.services.model.getLinkHrefByType(Constants.Link.ROLE_CREATE, this.identity);
                this.services.rest.insertRoleByHref(saveHref, this.role).subscribe({
                    next: this.onSave.bind(this),
                    error: this.onServerError.bind(this)
                });

            } else {

                // update

                let saveHref = this.services.model.getLinkHrefByType(Constants.Link.MODIFY, this.role);
                this.services.rest.updateRoleByHref(saveHref, this.role).subscribe({
                    next: this.onSave.bind(this),
                    error: this.onServerError.bind(this)
                });
            }
        }
    }

    public onSave() {
        this.services.route.goToRolesPage(this.identityHref);
    }

}
