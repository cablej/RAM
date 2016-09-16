import * as mongoose from 'mongoose';
import {conf} from '../bootstrap';
import {doResetDataInMongo} from '../resetDataInMongo';
import {Principal} from '../models/principal.model';
import {Headers} from '../controllers/headers';
import {context} from '../providers/context.provider';
import {IIdentity} from '../models/identity.model';

console.log('\nUsing mongo: ', conf.mongoURL, '\n');

export const connectDisconnectMongo = () => {

    beforeEach((done) => {
        mongoose.Promise = Promise as any;
        mongoose.connect(conf.mongoURL, {}, done);
    });

    afterEach((done) => {
        mongoose.connection.close(done);
    });

};

export const resetDataInMongo = () => {
    beforeEach((done) => {
        doResetDataInMongo(done);
    });
};

export const login = (identity: IIdentity) => {
    context.set(Headers.Principal, new Principal(identity.idValue, identity.profile.name._displayName, false, undefined, identity));
    context.set(Headers.PrincipalIdValue, identity.idValue);
};