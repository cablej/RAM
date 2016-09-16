import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {sendResource, sendList, sendError, sendNotFoundError, validateReqSchema} from './helpers';
import {Headers} from './headers';
import {PartyModel, PartyType} from '../models/party.model';

export class PartyController {

    constructor() {
    }

    private findMe = async(req: Request, res: Response) => {
        const identity = res.locals[Headers.Identity];
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => identity ? PartyModel.findByIdentityIdValue(identity.idValue) : null)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findByIdentityIdValue = (req: Request, res: Response) => {
        const schema = {
            'idValue': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Id Value is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => PartyModel.findByIdentityIdValue(req.params.idValue))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findTypeByCode = (req: Request, res: Response) => {
        const schema = {
            'code': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Code is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => PartyType.valueOf(req.params.code) as PartyType)
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private listTypes = (req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => PartyType.values() as PartyType[])
            .then((results) => results ? results.map((model) => model.toHrefValue(true)) : null)
            .then(sendList(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/v1/party/identity/me',
            context.begin,
            context.isAuthenticated,
            this.findMe);

        router.get('/v1/party/identity/:idValue',
            context.begin,
            context.isAuthenticated,
            this.findByIdentityIdValue);

        router.get('/v1/partyType/:code',
            context.begin,
            this.findTypeByCode);

        router.get('/v1/partyTypes',
            context.begin,
            this.listTypes);

        return router;

    };

}