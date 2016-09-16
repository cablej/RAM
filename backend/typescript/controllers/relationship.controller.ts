import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {
    sendHtml,
    sendResource,
    sendList,
    sendSearchResult,
    sendError,
    sendNotFoundError,
    validateReqSchema
} from './helpers';
import {PartyModel} from '../models/party.model';
import {RelationshipStatus, RelationshipModel} from '../models/relationship.model';
import {Relationship as DTO, FilterParams} from '../../../commons/api';
import {Headers} from './headers';

// todo add data security
export class RelationshipController {

    constructor() {
    }

    private findByIdentifier = async(req: Request, res: Response) => {
        const schema = {
            'identifier': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Identifier is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByIdentifier(req.params.identifier))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findByInvitationCode = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                notEmpty: true,
                errorMessage: 'Invitation Code is not valid'
            }
        };
        const invitationCode = req.params.invitationCode;
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByInvitationCode(invitationCode))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private printByInvitationCode = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Identifier is not valid'
            }
        };
        const invitationCode = req.params.invitationCode;
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByInvitationCode(invitationCode))
            .then((model) => model ? model.toDTO() : null)
            .then(sendHtml(res, 'relationship-invitation.html'))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private claimByInvitationCode = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                notEmpty: true,
                errorMessage: 'Invitation Code is not valid'
            }
        };
        const invitationCode = req.params.invitationCode;
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByInvitationCode(invitationCode))
            .then((model) => model ? model.claimPendingInvitation(context.getAuthenticatedIdentity(), invitationCode) : null)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private acceptByInvitationCode = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                notEmpty: true,
                errorMessage: 'Invitation Code is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByInvitationCode(req.params.invitationCode))
            .then((model) => model ? model.acceptPendingInvitation(context.getAuthenticatedIdentity()) : null)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private rejectByInvitationCode = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                notEmpty: true,
                errorMessage: 'Invitation Code is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByInvitationCode(req.params.invitationCode))
            .then((model) => model ? model.rejectPendingInvitation(context.getAuthenticatedIdentity()) : null)
            .then((model) => model ? Promise.resolve({}) : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private notifyDelegateByInvitationCode = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                notEmpty: true,
                errorMessage: 'Invitation Code is not valid'
            },
            'email': {
                in: 'body',
                notEmpty: true,
                isEmail: {
                    errorMessage: 'Email is not valid'
                },
                errorMessage: 'Email is not supplied'
            }
        };

        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findPendingByInvitationCodeInDateRange(req.params.invitationCode, new Date()))
            .then((model) => model ? model.notifyDelegate(req.body.email, context.getAuthenticatedIdentity()) : null)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    /* tslint:disable:max-func-body-length */
    // todo this search might no longer be useful from SS2
    private searchBySubjectOrDelegate = async(req: Request, res: Response) => {
        const schema = {
            'subject_or_delegate': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Subject Or Delegate is not valid',
                matches: {
                    options: ['^(subject|delegate)$'],
                    errorMessage: 'Subject Or Delegate is not valid'
                }
            },
            'identity_id': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Identity Id is not valid'
            },
            'page': {
                in: 'query',
                notEmpty: true,
                isNumeric: {
                    errorMessage: 'Page is not valid'
                }
            },
            'pageSize': {
                in: 'query',
                optional: true,
                isNumeric: {
                    errorMessage: 'Page Size is not valid'
                }
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.search(
                req.params.subject_or_delegate === 'subject' ? req.params.identity_id : null,
                req.params.subject_or_delegate === 'delegate' ? req.params.identity_id : null,
                parseInt(req.query.page),
                req.query.pageSize ? parseInt(req.query.pageSize) : null)
            )
            .then((results) => (results.map((model) => model.toHrefValue(true))))
            .then(sendSearchResult(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    /* tslint:disable:max-func-body-length */
    private searchByIdentity = async(req: Request, res: Response) => {
        const schema = {
            'identity_id': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Identity Id is not valid'
            },
            'filter': {
                in: 'query'
            },
            'page': {
                in: 'query',
                notEmpty: true,
                isNumeric: {
                    errorMessage: 'Page is not valid'
                }
            },
            'pageSize': {
                in: 'query',
                optional: true,
                isNumeric: {
                    errorMessage: 'Page Size is not valid'
                }
            }
        };
        const filterParams = FilterParams.decode(req.query.filter);
        validateReqSchema(req, schema)
            .then(async(req: Request) => {
                const myPrincipal = context.getAuthenticatedPrincipal();
                const hasAccess = await PartyModel.hasAccess(req.params.identity_id, myPrincipal);
                if (!hasAccess) {
                    throw new Error('403');
                }
                return req;
            })
            .then((req: Request) => RelationshipModel.searchByIdentity(
                req.params.identity_id,
                filterParams.get('partyType'),
                filterParams.get('relationshipType'),
                filterParams.get('relationshipTypeCategory'),
                filterParams.get('profileProvider'),
                filterParams.get('status'),
                false,
                filterParams.get('text'),
                filterParams.get('sort'),
                parseInt(req.query.page),
                req.query.pageSize ? parseInt(req.query.pageSize) : null)
            )
            .then((results) => (results.map((model) => model.toHrefValue(true))))
            .then(sendSearchResult(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private searchDistinctSubjectsForMe = async(req: Request, res: Response) => {
        const schema = {
            'filter': {
                in: 'query'
            },
            'page': {
                in: 'query',
                notEmpty: true,
                isNumeric: {
                    errorMessage: 'Page is not valid'
                }
            },
            'pageSize': {
                in: 'query',
                optional: true,
                isNumeric: {
                    errorMessage: 'Page Size is not valid'
                }
            }
        };
        const filterParams = FilterParams.decode(req.query.filter);
        validateReqSchema(req, schema)
            .then((req: Request) => {
                const principal = context.getAuthenticatedPrincipal();
                if (principal.agencyUserInd) {
                    throw new Error('403');
                } else {
                    return RelationshipModel.searchDistinctSubjectsForMe(
                        res.locals[Headers.Identity].party,
                        filterParams.get('partyType'),
                        filterParams.get('authorisationManagement'),
                        filterParams.get('text'),
                        filterParams.get('sort'),
                        parseInt(req.query.page),
                        req.query.pageSize);
                }
            })
            .then((results) => (results.map((model) => model.toHrefValue(true))))
            .then(sendSearchResult(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private create = async(req: Request, res: Response) => {
        const schema = {
            'relationshipType.href': {
                in: 'body',
                matches: {
                    options: ['^/api/v1/relationshipType/'],
                    errorMessage: 'Relationship type is not valid'
                }
            },
            'startTimestamp': {
                in: 'body',
                notEmpty: true,
                isDate: {
                    errorMessage: 'Start timestamp is not a valid date'
                },
                errorMessage: 'Start timestamp is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.createFromDto(DTO.build(req.body) as DTO))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private modify = async(req: Request, res: Response) => {
        const schema = {
            'identifier': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Relationship identity value not valid'
            },
            'relationshipType.href': {
                in: 'body',
                matches: {
                    options: ['^/api/v1/relationshipType/'],
                    errorMessage: 'Relationship type is not valid'
                }
            },
            'subject.href': {
                in: 'body',
                matches: {
                    options: ['^/api/v1/party/identity/'],
                    errorMessage: 'Subject identity id value not valid'
                }
            },
            'delegate.href': {
                in: 'body',
                matches: {
                    options: ['^/api/v1/party/identity/'],
                    errorMessage: 'Delegate identity id value not valid'
                }
            },
            'startTimestamp': {
                in: 'body',
                notEmpty: true,
                errorMessage: 'Start timestamp is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipModel.findByIdentifier(req.params.identifier))
            .then((model) => model ? model.modify(DTO.build(req.body) as DTO) : null)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findStatusByCode = (req: Request, res: Response) => {
        const schema = {
            'code': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Code is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipStatus.valueOf(req.params.code) as RelationshipStatus)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch((err) => sendError(res)(err));
    };

    private listStatuses = (req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipStatus.values() as RelationshipStatus[])
            .then((results) => results ? results.map((model) => model.toHrefValue(true)) : null)
            .then(sendList(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/v1/relationship/:identifier',
            context.begin,
            context.isAuthenticated,
            this.findByIdentifier);

        router.get('/v1/relationship/invitationCode/:invitationCode',
            context.begin,
            context.isAuthenticated,
            this.findByInvitationCode);

        router.get('/v1/relationship/invitationCode/:invitationCode/print',
            context.begin,
            context.isAuthenticated,
            this.printByInvitationCode);

        router.post('/v1/relationship/invitationCode/:invitationCode/claim',
            context.begin,
            context.isAuthenticated,
            this.claimByInvitationCode);

        router.post('/v1/relationship/invitationCode/:invitationCode/accept',
            context.begin,
            context.isAuthenticated,
            this.acceptByInvitationCode);

        router.post('/v1/relationship/invitationCode/:invitationCode/reject',
            context.begin,
            context.isAuthenticated,
            this.rejectByInvitationCode);

        router.post('/v1/relationship/invitationCode/:invitationCode/notifyDelegate',
            context.begin,
            context.isAuthenticated,
            this.notifyDelegateByInvitationCode);

        router.get('/v1/relationships/:subject_or_delegate/identity/:identity_id',
            context.begin,
            context.isAuthenticated,
            this.searchBySubjectOrDelegate);

        router.get('/v1/relationships/identity/subjects',
            context.begin,
            context.isAuthenticated,
            this.searchDistinctSubjectsForMe);

        router.get('/v1/relationships/identity/:identity_id',
            context.begin,
            context.isAuthenticated,
            this.searchByIdentity);

        router.post('/v1/relationship',
            context.begin,
            context.isAuthenticated,
            this.create);

        router.put('/v1/relationship/:identifier',
            context.begin,
            context.isAuthenticated,
            this.modify);

        router.get('/v1/relationshipStatus/:code',
            context.begin,
            this.findStatusByCode);

        router.get('/v1/relationshipStatuses',
            context.begin,
            this.listStatuses);

        return router;

    };
}
