import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {Validators, REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup, FORM_DIRECTIVES} from '@angular/forms';

import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {Constants} from '../../../../commons/constants';
import {RAMServices} from '../../services/ram-services';

import {IIdentity} from '../../../../commons/api';

@Component({
    selector: 'enter-invitation-code',
    templateUrl: 'enter-invitation-code.component.html',
    directives: [REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, ROUTER_DIRECTIVES, PageHeaderAuthComponent]
})

export class EnterInvitationCodeComponent extends AbstractPageComponent {

    public identityHref: string;

    public identity: IIdentity;

    public form: FormGroup;

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Authorisations');
    }

    public onInit(params: {path:Params, query:Params}) {

        // extract path and query parameters
        this.identityHref = params.path['identityHref'];

        // message
        const msg = params.query['msg'];
        if (msg === Constants.GlobalMessage.INVALID_CODE) {
            this.addGlobalMessage('The code you have entered does not exist or is invalid.');
        }

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });

        // forms
        this.form = this.fb.group({
            'relationshipCode': ['', Validators.compose([Validators.required])]
        });

    }

    public onFindIdentity(identity: IIdentity) {
        this.identity = identity;
    }

    public activateCode(event: Event) {

        // todo need to discuss with architects to change this api so the href doesn't require the code and we can use HATEOAS?
        this.services.rest.claimRelationshipByInvitationCode(this.form.controls['relationshipCode'].value)
            .subscribe((relationship) => {
                this.services.route.goToRelationshipAcceptPage(
                    this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity),
                    this.services.model.getLinkHrefByType(Constants.Link.SELF, relationship)
                );
            }, (err) => {
                const status = err.status;
                if (status === 404) {
                    this.addGlobalMessage('The code you have entered does not exist or is invalid.');
                } else {
                    this.addGlobalErrorMessages(err);
                }
            });

        event.stopPropagation();
        return false;
    }

    public goToRelationshipsPage() {
        this.services.route.goToRelationshipsPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity)
        );
    };

}
