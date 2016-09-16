import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

@Injectable()
export class RAMRouteService {

    constructor(private router: Router) {
    }

    public goToHomePage() {
        this.router.navigate(['/home']);
    }

    public goToAccessDeniedPage() {
        this.router.navigate(['/403']);
    }

    public goToAuthorisationsHomePage() {
        this.router.navigate(['/home/auth']);
    }

    public goToSoftwareServicesProviderHomePage() {
        this.router.navigate(['/home/sps']);
    }

    public goToRelationshipsPage(identityHref: string, filter?: string, page?: number, msg?: string) {
        const queryParams = {};
        if (filter) {
            queryParams['filter'] = filter;
        }
        if (page) {
            queryParams['page'] = page;
        }
        if (msg) {
            queryParams['msg'] = msg;
        }
        this.router.navigate(['/relationships',
                this.encodeURIComponent(identityHref, true)],
            {queryParams: queryParams}
        );
    }

    public goToAddRelationshipPage(identityHref: string) {
        this.router.navigate(['/relationships/add',
            this.encodeURIComponent(identityHref, true)
        ]);
    }

    public goToEditRelationshipPage(identityHref: string, relationshipHref: string) {
        this.router.navigate(['/relationships/edit',
            this.encodeURIComponent(identityHref, true),
            this.encodeURIComponent(relationshipHref, true)
        ]);
    }

    public goToRelationshipAddCompletePage(identityHref: string, relationshipHref: string) {
        this.router.navigate(['/relationships/add/complete',
            this.encodeURIComponent(identityHref, true),
            this.encodeURIComponent(relationshipHref, true)
        ]);
    }

    public goToRelationshipEnterCodePage(identityHref: string, msg?: string) {
        const queryParams = {};
        if (msg) {
            queryParams['msg'] = msg;
        }
        this.router.navigate(['/relationships/add/enter',
                this.encodeURIComponent(identityHref, true)
            ], {queryParams: queryParams}
        );
    }

    public goToRelationshipAcceptPage(identityHref: string, relationshipHref: string) {
        this.router.navigate(['/relationships/add/accept',
            this.encodeURIComponent(identityHref, true),
            this.encodeURIComponent(relationshipHref, true)
        ]);
    }

    public goToRolesPage(href: string, page?: number) {
        const queryParams = {};
        if (page) {
            queryParams['page'] = page;
        }
        this.router.navigate(['/roles',
                this.encodeURIComponent(href, true)
            ], {queryParams: queryParams}
        );
    }

    public goToAddRolePage(href: string) {
        this.router.navigate(['/roles/add',
                this.encodeURIComponent(href, true)
            ], {queryParams: {}}
        );
    }

    public goToEditRolePage(identityHref: string, roleHref: string) {
        this.router.navigate(['/roles/edit',
                this.encodeURIComponent(identityHref, true),
                this.encodeURIComponent(roleHref, true)
            ], {queryParams: {}}
        );
    }

    public goToBusinessesPage(filter?: string, page?: number) {
        const queryParams = {};
        if (filter) {
            queryParams['filter'] = filter;
        }
        if (page) {
            queryParams['page'] = page;
        }
        this.router.navigate(['/businesses'],
            {queryParams: queryParams}
        );
    }

    public goToNotificationsPage(identityHref: string, page?: number, msg?: string) {
        const queryParams = {};
        if (page) {
            queryParams['page'] = page;
        }
        if (msg) {
            queryParams['msg'] = msg;
        }
        this.router.navigate(['/notifications/',
                this.encodeURIComponent(identityHref, true)
            ], {queryParams: queryParams}
        );
    }

    public goToAddNotificationPage(identityHref: string) {
        this.router.navigate(['/notifications/add/',
            this.encodeURIComponent(identityHref, true)
        ]);
    }

    public goToEditNotificationPage(identityHref: string, relationshipHref: string) {
        this.router.navigate(['/notifications/edit/',
            this.encodeURIComponent(identityHref, true),
            this.encodeURIComponent(relationshipHref, true)
        ]);
    }

    private encodeURIComponent(value: string, href: boolean) {
        if (href) {
            return encodeURIComponent(window.btoa(value));
        }
        return encodeURIComponent(value);
    }

    public decodeURIComponent(key: string, value: string) {
        if (key === 'href' || key.indexOf('Href') !== -1) {
            return window.atob(decodeURIComponent(value));
        }
        return decodeURIComponent(value);
    }

    public goToAgencySelectBusinessForAuthorisationsPage() {
        this.router.navigate(['/agency/selectBusiness/auth']);
    }

    public goToAgencySelectBusinessForSoftwareProviderServicesPage() {
        this.router.navigate(['/agency/selectBusiness/sps']);
    }

}