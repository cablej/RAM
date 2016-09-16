import {Router, Request, Response} from 'express';
import {context} from '../providers/context.provider';
import {sendResource, sendList, sendError, sendNotFoundError, validateReqSchema} from './helpers';
import {RelationshipTypeModel} from '../models/relationshipType.model';

export class RelationshipTypeController {

    private findByCodeIgnoringDateRange = async(req: Request, res: Response) => {
        const schema = {
            'code': {
                in: 'params',
                notEmpty: true,
                errorMessage: 'Code is not valid'
            }
        };
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipTypeModel.findByCodeIgnoringDateRange(req.params.code))
            .then((model) => model ? model.toDTO() : null)
            .then(sendResource(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    private listIgnoringDateRange = async(req: Request, res: Response) => {
        const schema = {};
        validateReqSchema(req, schema)
            .then((req: Request) => RelationshipTypeModel.listIgnoringDateRange())
            .then((results) => results ? results.map((model) => model.toHrefValue(true)) : null)
            .then(sendList(res))
            .then(sendNotFoundError(res))
            .catch(sendError(res));
    };

    public assignRoutes = (router: Router) => {

        router.get('/v1/relationshipType/:code',
            context.begin,
            this.findByCodeIgnoringDateRange);

        router.get('/v1/relationshipTypes',
            context.begin,
            this.listIgnoringDateRange);

        return router;

    };

}
