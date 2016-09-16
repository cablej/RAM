import {Observable} from 'rxjs/Observable';
import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, ActivatedRoute, Router, Params} from '@angular/router';
import {FormBuilder} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {Dialog} from 'primeng/primeng';
import {AbstractPageComponent} from '../abstract-page/abstract-page.component';
import {PageHeaderAuthComponent} from '../../components/page-header/page-header-auth.component';
import {MarkdownComponent} from '../../components/ng2-markdown/ng2-markdown.component';
import {RAMServices} from '../../services/ram-services';
import {Constants} from '../../../../commons/constants';
import {
    IIdentity,
    IRelationship,
    IRelationshipType,
    IRelationshipAttribute,
    IRelationshipAttributeNameUsage
} from '../../../../commons/api';
import {RelationshipCanAcceptPermission} from '../../../../commons/permissions/relationshipPermission.templates';

@Component({
    selector: 'accept-authorisation',
    templateUrl: 'accept-authorisation.component.html',
    directives: [ROUTER_DIRECTIVES, PageHeaderAuthComponent, MarkdownComponent, Dialog]
})

export class AcceptAuthorisationComponent extends AbstractPageComponent {

    public identityHref: string;
    public relationshipHref: string;

    public relationship$: Observable<IRelationship>;
    public relationshipType$: Observable<IRelationshipType>;

    public identity: IIdentity;
    public relationship: IRelationship;
    public delegateManageAuthorisationAllowedIndAttribute: IRelationshipAttribute;
    public delegateRelationshipTypeDeclarationAttributeUsage: IRelationshipAttributeNameUsage;

    public declineDisplay: boolean = false;
    public canAccept: boolean;

    constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, services: RAMServices) {
        super(route, router, fb, services);
        this.setBannerTitle('Authorisations');
    }

    /* tslint:disable:max-func-body-length */
    public onInit(params: {path: Params, query: Params}) {
        // extract path and query parameters
        this.identityHref = params.path['identityHref'];
        this.relationshipHref = params.path['relationshipHref'];

        // identity in focus
        this.services.rest.findIdentityByHref(this.identityHref).subscribe({
            next: this.onFindIdentity.bind(this),
            error: this.onServerError.bind(this)
        });

        // relationship
        this.relationship$ = this.services.rest.findRelationshipByHref(this.relationshipHref);
        this.relationship$.subscribe((relationship) => {
            this.relationship = relationship;
            this.delegateManageAuthorisationAllowedIndAttribute = relationship.getAttribute(Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND);

            let permission = this.relationship.getPermission(RelationshipCanAcceptPermission);
            this.canAccept = permission.isAllowed();
            if (!permission.isAllowed()) {
                this.addGlobalMessages(permission.messages);
            }

            this.relationshipType$ = this.services.rest.findRelationshipTypeByHref(relationship.relationshipType.href);
            this.relationshipType$.subscribe((relationshipType) => {
                for (let attributeUsage of relationshipType.relationshipAttributeNames) {
                    if (attributeUsage.attributeNameDef.value.code === 'DELEGATE_RELATIONSHIP_TYPE_DECLARATION') {
                        this.delegateRelationshipTypeDeclarationAttributeUsage = attributeUsage;
                    }
                }
            });
        }, (err) => {
            if (err.status === 404) {
                this.goToEnterAuthorisationPage();
            } else {
                this.addGlobalErrorMessages(err);
            }
        });

    }

    public onFindIdentity(identity: IIdentity) {
        this.identity = identity;
    }

    public isManageAuthorisationAllowed() {
        return this.delegateManageAuthorisationAllowedIndAttribute &&
            this.delegateManageAuthorisationAllowedIndAttribute.value &&
            'true' === this.delegateManageAuthorisationAllowedIndAttribute.value[0];
    }

    public showDeclineConfirmation() {
        this.declineDisplay = true;
    };

    public cancelDeclineConfirmation() {
        this.declineDisplay = false;
    };

    public confirmDeclineAuthorisation() {
        this.services.rest.rejectPendingRelationshipByInvitationCode(this.relationship).subscribe({
            next: this.onDecline.bind(this),
            error: () => {
                this.declineDisplay = false;
                this.onServerError.bind(this);
            }
        });
    };

    public acceptAuthorisation() {
        this.services.rest.acceptPendingRelationshipByInvitationCode(this.relationship).subscribe({
            next: this.onAccept.bind(this),
            error: this.onServerError.bind(this)
        });
    };

    private onDecline() {
        this.declineDisplay = false;
        this.services.route.goToRelationshipsPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity),
            null,
            1,
            Constants.GlobalMessage.DECLINED_RELATIONSHIP
        );
    }

    private onAccept() {
        this.services.route.goToRelationshipsPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity),
            null,
            1,
            Constants.GlobalMessage.ACCEPTED_RELATIONSHIP
        );
    }

    public goToEnterAuthorisationPage() {
        this.services.route.goToRelationshipEnterCodePage(this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity), Constants.GlobalMessage.INVALID_CODE);
    };

    public goToRelationshipsPage() {
        this.services.route.goToRelationshipsPage(
            this.services.model.getLinkHrefByType(Constants.Link.SELF, this.identity),
            null,
            1,
            Constants.GlobalMessage.CANCEL_ACCEPT_RELATIONSHIP
        );
    };

    // TODO: not sure how to set the locale, Implement as a pipe
    public displayDate(dateString: string) {
        if (dateString) {
            const date = new Date(dateString);
            const datePipe = new DatePipe();
            return datePipe.transform(date, 'd') + ' ' +
                datePipe.transform(date, 'MMMM') + ' ' +
                datePipe.transform(date, 'yyyy');
        }
        return 'Not specified';
    }

}