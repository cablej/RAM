import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {sendResource, sendError, sendNotFoundError, validateReqSchema} from './helpers';
import {conf} from '../bootstrap';
import {HealthCheck} from '../models/healthCheck.model';

export class SystemController {

    private healthCheckShallow = async(req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => {
                return new HealthCheck(200, 'OK');
            })
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private healthCheckDeep = async(req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => {
                return new HealthCheck(200, 'OK');
            })
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private contextEcho = async(req: Request, res: Response) => {
        let msg = req.query['msg'];
        let pause = +req.query['pause'];
        console.log('Msg:', msg);
        context.set('msg', msg);
        context.set(msg, msg);
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => {
                return {};
            })
            .then(async(model: {[key: string]: string}) => {
                for (let i = 0; i < pause; i = i + 1) {
                    // await IdentityModel.findByInvitationCode('some id ' + msg);
                }
                model[msg] = context.get(msg);
                model['msg copy'] = context.get('msg');
                model['msg reply'] = context.get('msg reply');
                model['identity'] = context.getAuthenticatedIdentityIdValue();
                return model;
            })
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/healthcheck/shallow',
            context.begin,
            this.healthCheckShallow);

        router.get('/healthcheck/deep',
            context.begin,
            this.healthCheckDeep);

        if (conf.devMode) {
            router.get('/context/echo',
                context.begin,
                this.contextEcho);
        }

        return router;

    };

}