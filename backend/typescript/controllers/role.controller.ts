import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {sendResource, sendList, sendSearchResult, sendError, sendNotFoundError, validateReqSchema} from './helpers';
import {Url} from '../models/url';
import {FilterParams} from '../../../commons/api';
import {RoleModel, RoleStatus} from '../models/role.model';
import {PartyModel, IParty} from '../models/party.model';

// todo add data security
export class RoleController {

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
            .then((req: Request) => RoleModel.searchByIdentity(
                req.params.identity_id,
                filterParams.get('roleType'),
                filterParams.get('status'),
                filterParams.get('inDateRange') === 'true',
                parseInt(req.query.page),
                req.query.pageSize ? parseInt(req.query.pageSize) : null)
            )
            .then((results) => (results.map((model) => model.toHrefValue(true))))
            .then(sendSearchResult(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private findByIdentifier = async(req: Request, res: Response) => {
        const schema = {
            'identifier': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Identifier is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RoleModel.findByIdentifier(req.params.identifier))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private create = async(req: Request, res: Response) => {
        const schema = {
            'roleType.value.code': {
                in: 'body',
                notEmpty: true,
                errorMessage: 'Code is not valid'
            },
            'party.href': {
                in: 'body',
                notEmpty: true,
                errorMessage: 'Party is missing'
            }
        };
        validateReqSchema(req, schema)
            .then(async(req: Request) => {
                const idValue = Url.lastPathElement(req.body.party.href);
                if (!idValue) {
                    console.log('Id value not found from party href', req.body.party.href);
                    throw new Error('400');
                }
                const myPrincipal = context.getAuthenticatedPrincipal();
                const hasAccess = await PartyModel.hasAccess(idValue, myPrincipal);
                if (!hasAccess) {
                    console.log('Identity access denied or does not exist', idValue);
                    throw new Error('403');
                }
                const party = await PartyModel.findByIdentityIdValue(idValue);
                if (!party) {
                    console.log('Party not found for id value', idValue);
                    throw new Error('404');
                }
                return party;
            })
            .then((party: IParty) => {
                const agencyUser = context.getAuthenticatedAgencyUser();
                return party.addOrModifyRole(req.body, agencyUser);
            })
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private modify = async(req: Request, res: Response) => {
        const schema = {
            'roleType.href': {
                in: 'body',
                notEmpty: true,
                errorMessage: 'Code is not valid'
            },
            'party.href': {
                in: 'body',
                notEmpty: true,
                errorMessage: 'Party is missing'
            }
        };
        validateReqSchema(req, schema)
            .then(async(req: Request) => {
                const idValue = Url.lastPathElement(req.body.party.href);
                if (!idValue) {
                    console.log('Id value not found from party href', req.body.party.href);
                    throw new Error('400');
                }
                const myPrincipal = context.getAuthenticatedPrincipal();
                const hasAccess = await PartyModel.hasAccess(idValue, myPrincipal);
                if (!hasAccess) {
                    console.log('Identity access denied or does not exist', idValue);
                    throw new Error('403');
                }
                const party = await PartyModel.findByIdentityIdValue(idValue);
                if (!party) {
                    console.log('Party not found for id value', idValue);
                    throw new Error('404');
                }
                return party;
            })
            .then((party: IParty) => {
                return party.modifyRole(req.body);
            })
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private listStatuses = (req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => RoleStatus.values() as RoleStatus[])
            .then((results) => results ? results.map((model) => model.toHrefValue(true)) : null)
            .then(sendList(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/v1/roles/identity/:identity_id',
            context.begin,
            context.isAuthenticated,
            this.searchByIdentity);

        router.get('/v1/role/:identifier',
            context.begin,
            context.isAuthenticated,
            this.findByIdentifier);

        router.post('/v1/role',
            context.begin,
            context.isAuthenticatedAsAgencyUser,
            this.create);

        router.put('/v1/role/:identifier',
            context.begin,
            context.isAuthenticated,
            this.modify);

        router.get('/v1/roleStatuses',
            context.begin,
            this.listStatuses);

        return router;

    };

}
