import {logger} from '../logger';
import * as colors from 'colors';
import {Request, Response} from 'express';
import {Headers} from './headers';
import {ErrorResponse, CreateIdentityDTO} from '../../../commons/api';
import {AgencyUser, IAgencyUserProgramRole, AgencyUserProgramRole} from '../models/agencyUser.model';
import {Principal} from '../models/principal.model';
import {IIdentity, IdentityModel} from '../models/identity.model';
import {DOB_SHARED_SECRET_TYPE_CODE} from '../models/sharedSecretType.model';

// todo determine if we need to base64 decode header values to be spec compliant?

class Security {

    public prepareRequest(): (req: Request, res: Response, next: () => void) => void {
        return (req: Request, res: Response, next: () => void) => {
            //this.logHeaders(req);
            const agencyUserLoginIdValue = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.AgencyUserLoginId);
            const identityIdValue = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.IdentityIdValue);
            //console.log('agencyUserLoginIdValue=', agencyUserLoginIdValue);
            //console.log('identityIdValue=', identityIdValue);
            if (agencyUserLoginIdValue) {
                // agency login supplied, carry on
                Promise.resolve(agencyUserLoginIdValue)
                    .then(this.prepareAgencyUserResponseLocals(req, res, next))
                    .then(this.prepareCommonResponseLocals(req, res, next))
                    .catch(this.reject(res, next));
            } else if (identityIdValue) {
                // identity id supplied, try to lookup and if not found create a new identity before carrying on
                IdentityModel.findByIdValue(identityIdValue)
                    .then(this.createIdentityIfNotFound(req, res))
                    .then(this.prepareIdentityResponseLocals(req, res, next))
                    .then(this.prepareCommonResponseLocals(req, res, next))
                    .catch(this.reject(res, next));
            } else {
                // no id supplied, carry on
                Promise.resolve(null)
                    .then(this.prepareIdentityResponseLocals(req, res, next))
                    .then(this.prepareCommonResponseLocals(req, res, next))
                    .catch(this.reject(res, next));
            }
        };
    }

    private getValueFromHeaderLocalsOrCookie(req: Request, res: Response, key: string): string {

        // look for id in headers
        if (req.get(key)) {
            // logger.info('found header', req.get(key));
            return req.get(key);
        }

        // look for id in locals
        if (res.locals[key]) {
            // logger.info('found local', res.locals[key]);
            return res.locals[key];
        }

        // look for id in cookies
        return SecurityHelper.getValueFromCookies(req, key);

    }

    /* tslint:disable:max-func-body-length */
    private createIdentityIfNotFound(req: Request, res: Response) {
        return (identity?: IIdentity) => {
            const rawIdValue = req.get(Headers.IdentityRawIdValue);
            if (identity) {
                logger.info('Identity context: Using existing identity ...');
                return Promise.resolve(identity);
            } else if (!rawIdValue) {
                logger.info('Identity context: Unable to create identity as raw id value was not supplied ...'.red);
                return Promise.resolve(null);
            } else {
                const dto = new CreateIdentityDTO(
                    rawIdValue,
                    req.get(Headers.PartyType),
                    req.get(Headers.GivenName),
                    req.get(Headers.FamilyName),
                    req.get(Headers.UnstructuredName),
                    DOB_SHARED_SECRET_TYPE_CODE,
                    req.get(Headers.DOB),
                    req.get(Headers.IdentityType),
                    req.get(Headers.IdentityStrength) ? parseInt(req.get(Headers.IdentityStrength)) : undefined,
                    req.get(Headers.AgencyScheme),
                    req.get(Headers.AgencyToken),
                    req.get(Headers.LinkIdScheme),
                    req.get(Headers.LinkIdConsumer),
                    req.get(Headers.PublicIdentifierScheme),
                    req.get(Headers.ProfileProvider)
                );
                logger.info('Identity context: Creating new identity ... ');
                return IdentityModel.createFromDTO(dto);
            }
        };
    }

    private prepareAgencyUserResponseLocals(req: Request, res: Response, next: () => void) {
        return (idValue: string) => {
            logger.info('Agency User context:', (idValue ? colors.magenta(idValue) : colors.red('[not found]')));
            if (idValue) {
                const givenName = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.GivenName);
                const familyName = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.FamilyName);
                const displayName = givenName ? givenName + (familyName ? ' ' + familyName : '') : (familyName ? familyName : '');
                const programRoles: IAgencyUserProgramRole[] = [];
                const programRolesRaw = this.getValueFromHeaderLocalsOrCookie(req, res, Headers.AgencyUserProgramRoles);
                if (programRolesRaw) {
                    const programRowStrings = programRolesRaw.split(',');
                    for (let programRoleString of programRowStrings) {
                        programRoles.push(new AgencyUserProgramRole(
                            programRoleString.split(':')[0],
                            programRoleString.split(':')[1]
                        ));
                    }
                }
                const agencyUser = new AgencyUser(
                    idValue,
                    givenName,
                    familyName,
                    displayName,
                    this.getValueFromHeaderLocalsOrCookie(req, res, Headers.AgencyUserAgency),
                    programRoles
                );
                res.locals[Headers.Principal] = new Principal(idValue, displayName, true, agencyUser, undefined);
                res.locals[Headers.PrincipalIdValue] = idValue;
                res.locals[Headers.AgencyUser] = agencyUser;
            }
        };
    }

    private prepareIdentityResponseLocals(req: Request, res: Response, next: () => void) {
        return (identity?: IIdentity) => {
            logger.info('Identity context:', (identity ? colors.magenta(identity.idValue) : colors.red('[not found]')));
            if (identity) {
                res.locals[Headers.Principal] = new Principal(identity.idValue, identity.profile.name._displayName, false, undefined, identity);
                res.locals[Headers.PrincipalIdValue] = identity.idValue;
                res.locals[Headers.Identity] = identity;
                res.locals[Headers.IdentityIdValue] = identity.idValue;
                res.locals[Headers.IdentityRawIdValue] = identity.rawIdValue;
                res.locals[Headers.GivenName] = identity.profile.name.givenName;
                res.locals[Headers.FamilyName] = identity.profile.name.familyName;
                res.locals[Headers.UnstructuredName] = identity.profile.name.unstructuredName;
                for (let sharedSecret of identity.profile.sharedSecrets) {
                    res.locals[`${Headers.Prefix}-${sharedSecret.sharedSecretType.code}`.toLowerCase()] = sharedSecret.value;
                }
                if (req.header(Headers.ABN)) {
                    logger.info('ABN header: ' + req.header(Headers.ABN));
                    res.locals[Headers.ABN] = req.header(Headers.ABN);
                }
            }
        };
    }

    private prepareCommonResponseLocals(req: Request, res: Response, next: () => void) {
        return () => {
            for (let key of Object.keys(req.headers)) {
                // keys should be lowercase, but let's make sure
                const keyLower = key.toLowerCase();
                // if it's an application key, copy it to locals
                if (keyLower.startsWith(Headers.Prefix)) {
                    const value = req.get(key);
                    res.locals[keyLower] = value;
                }
            }
            next();
        };
    }

    private reject(res: Response, next: () => void) {
        return (err: Error): void => {
            logger.error(('Unable to look up identity: ' + err).red);
            res.status(401);
            res.send(new ErrorResponse('Unable to look up identity.'));
        };
    }

    // private logHeaders(req:Request) {
    //     for (let header of Object.keys(req.headers)) {
    //         if(Headers.isXRAMHeader(header)) {
    //             logger.debug(header, '=', req.headers[header]);
    //         }
    //     }
    // }

}

export class SecurityHelper {

    public static getValueFromCookies(req: Request, keyToMatch: string): string {
        const keyToMatchLower = keyToMatch.toLowerCase();
        for (let key of Object.keys(req.cookies)) {
            const keyLower = key.toLowerCase();
            if (keyLower === keyToMatchLower) {
                const encodedValue = req.cookies[key];
                if (encodedValue) {
                    return new Buffer(encodedValue, 'base64').toString('ascii');
                }
            }
        }
        return null;
    }

}

export const security = new Security();
