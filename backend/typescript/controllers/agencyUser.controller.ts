import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {sendResource, sendList, sendError, sendNotFoundError, validateReqSchema} from './helpers';
import {conf} from '../bootstrap';
import {Headers} from './headers';
import {AgencyUsersSeeder} from '../seeding/seed-agency-users';
import {IAgencyUser} from '../models/agencyUser.model';

export class AgencyUserController {

    private findMe = async(req: Request, res: Response) => {
        const agencyUser = res.locals[Headers.AgencyUser];
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => agencyUser ? agencyUser : null)
            .then((model: IAgencyUser) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private search = async(req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => AgencyUsersSeeder.all())
            .then((results) => (results.map((model) => model.toDTO())))
            .then(sendList(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/v1/agencyUser/me',
            context.begin,
            context.isAuthenticatedAsAgencyUser,
            this.findMe);

        if (conf.devMode) {
            router.get('/v1/agencyUsers',
                context.begin,
                this.search);
        }

        return router;

    };

}
