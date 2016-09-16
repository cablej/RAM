import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {sendResource, sendError, sendNotFoundError, validateReqSchema, sendSearchResult} from './helpers';
import {Headers} from './headers';
import {conf} from '../bootstrap';
import {IdentityModel} from '../models/identity.model';

export class IdentityController {

    constructor() {
    }

    private findMe = async(req: Request, res: Response) => {
        const identity = res.locals[Headers.Identity];
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => identity ? identity : null)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findByIdentityIdValue = async(req: Request, res: Response) => {
        const schema = {
            'idValue': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Id Value is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => IdentityModel.findByIdValue(req.params.idValue))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findPendingByInvitationCodeInDateRange = async(req: Request, res: Response) => {
        const schema = {
            'invitationCode': {
                notEmpty: true,
                errorMessage: 'Invitation Code is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => IdentityModel.findPendingByInvitationCodeInDateRange(req.params.invitationCode, new Date()))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private search = async(req: Request, res: Response) => {
        const schema = {
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
            },
        };
        validateReqSchema(req, schema)
            .then((req: Request) => IdentityModel.searchLinkIds(
                parseInt(req.query.page),
                req.query.pageSize ? parseInt(req.query.pageSize) : null)
            )
            .then((results) => (results.map((model) => model.toHrefValue(true))))
            .then(sendSearchResult(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/v1/identity/me',
            context.begin,
            context.isAuthenticated,
            this.findMe);

        router.get('/v1/identity/:idValue',
            context.begin,
            context.isAuthenticated,
            this.findByIdentityIdValue);

        router.get('/v1/identity/invitationCode/:invitationCode',
            context.begin,
            context.isAuthenticated,
            this.findPendingByInvitationCodeInDateRange);

        if (conf.devMode) {
            router.get('/v1/identities', this.search);
        }

        return router;

    };

}
