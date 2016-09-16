import {Seeder} from './seed';
import {IIdentity} from '../models/identity.model';
import {IAgencyUser} from '../models/agencyUser.model';
import * as SharedSecretType from '../models/sharedSecretType.model';

import {Headers} from '../controllers/headers';
import * as fs from 'async-file';

const OBJECT_CLASSES =
    'objectClass: kbaInfoContainer\n' +
    'objectClass: iplanet-am-managed-person\n' +
    'objectClass: inetuser\n' +
    'objectClass: sunFMSAML2NameIdentifier\n' +
    'objectClass: inetorgperson\n' +
    'objectClass: devicePrintProfilesContainer\n' +
    'objectClass: sunIdentityServerLibertyPPService\n' +
    'objectClass: iplanet-am-user-service\n' +
    'objectClass: sunFederationManagerDataStore\n' +
    'objectClass: forgerock-am-dashboard-service\n' +
    'objectClass: oathDeviceProfilesContainer\n' +
    'objectClass: sunAMAuthAccountLockout\n' +
    'objectClass: organizationalperson\n' +
    'objectClass: top\n' +
    'objectClass: person\n' +
    'objectClass: iPlanetPreferences\n' +
    'objectClass: iplanet-am-auth-configuration-service\n' +
    'objectClass: ram-user\n';

/* tslint:disable:max-func-body-length */
/* tslint:disable:no-any */
export class LDIFExporter {

    private static ldifFileName: string;
    private static ldifFileHandle: number;

    public static async open(ldifFileName: string) {
        LDIFExporter.ldifFileName = ldifFileName;
        LDIFExporter.ldifFileHandle = await fs.open(LDIFExporter.ldifFileName, 'w');
        Seeder.log(`\n[LDIFExporter] Opened file: ${LDIFExporter.ldifFileName}\n`);
    }

    public static async close() {
        await fs.close(LDIFExporter.ldifFileHandle);
        Seeder.log(`\n[LDIFExporter] Closed file: ${LDIFExporter.ldifFileName}\n`);
    }

    public static async exportIdentity(identity: IIdentity) {
        if ((identity.party.partyType === 'INDIVIDUAL') && (identity.identityType === 'LINK_ID')) {
            await fs.appendFile(LDIFExporter.ldifFileName, LDIFExporter.getIdentityLDIF(identity));
            Seeder.log(`\n[LDIFExporter] Exported identity ${identity.idValue}\n`.green);
        } else {
            Seeder.log(`\n[LDIFExporter] Skipped export of identity ${identity.idValue}\n`.gray);
        }
    }

    public static async exportAgencyUser(agencyUser: IAgencyUser) {
        await fs.appendFile(LDIFExporter.ldifFileName, LDIFExporter.getAgencyUserLDIF(agencyUser));
        Seeder.log(`\n[LDIFExporter] Exported agency user ${agencyUser.id}\n`.green);
    }

    public static getIdentityLDIF(identity: IIdentity): string {
        let rawIdValueParts = identity.rawIdValue.split('_');

        let uid = rawIdValueParts[0];

        if (rawIdValueParts.length === 3) {
            uid += rawIdValueParts[2];
        }

        let ldif = `dn: uid=${uid},ou=people,ou=users,dc=openam,dc=ram,dc=ato,dc=gov,dc=au\n`;
        ldif += OBJECT_CLASSES;
        ldif += `uid: ${uid}\n`;
        ldif += 'inetUserStatus: Active\n';
        ldif += 'userPassword: password\n';

        // sn and cn are MUST attributes for the person objectClass - including givenName for completeness
        ldif += LDIFExporter.getAttributeLDIF('givenName', identity.profile.name.givenName);
        ldif += `sn: ${identity.profile.name.familyName}\n`;
        ldif += `cn: ${identity.profile.name.givenName} ${identity.profile.name.familyName}\n`;

        ldif += LDIFExporter.getAttributeLDIF(Headers.IdentityIdValue, identity.idValue);
        ldif += LDIFExporter.getAttributeLDIF(Headers.IdentityRawIdValue, identity.rawIdValue);
        ldif += LDIFExporter.getAttributeLDIF(Headers.IdentityType, identity.identityType);
        ldif += LDIFExporter.getAttributeLDIF(Headers.IdentityStrength, identity.strength);

        ldif += LDIFExporter.getAttributeLDIF(Headers.PartyType, identity.party.partyType);

        ldif += LDIFExporter.getAttributeLDIF(Headers.GivenName, identity.profile.name.givenName);
        ldif += LDIFExporter.getAttributeLDIF(Headers.FamilyName, identity.profile.name.familyName);
        ldif += LDIFExporter.getAttributeLDIF(Headers.UnstructuredName, identity.profile.name.unstructuredName);

        for (let sharedSecret of identity.profile.sharedSecrets) {
            if (sharedSecret.sharedSecretType.code === SharedSecretType.DOB_SHARED_SECRET_TYPE_CODE) {
                ldif += LDIFExporter.getAttributeLDIF(Headers.DOB, sharedSecret.value);
            }
        }

        ldif += LDIFExporter.getAttributeLDIF(Headers.ProfileProvider, identity.profile.provider);

        ldif += LDIFExporter.getAttributeLDIF(Headers.AgencyScheme, identity.agencyScheme);
        ldif += LDIFExporter.getAttributeLDIF(Headers.AgencyToken, identity.agencyToken);

        ldif += LDIFExporter.getAttributeLDIF(Headers.LinkIdScheme, identity.linkIdScheme);
        ldif += LDIFExporter.getAttributeLDIF(Headers.LinkIdConsumer, identity.linkIdConsumer);
        ldif += LDIFExporter.getAttributeLDIF(Headers.PublicIdentifierScheme, identity.publicIdentifierScheme);

        return ldif += '\n';
    }

    public static getAgencyUserLDIF(agencyUser: IAgencyUser): string {
        let uid = agencyUser.id;

        let ldif = `dn: uid=${uid},ou=people,ou=users,dc=openam,dc=ram,dc=ato,dc=gov,dc=au\n`;
        ldif += OBJECT_CLASSES;
        ldif += `uid: ${uid}\n`;
        ldif += 'inetUserStatus: Active\n';
        ldif += 'userPassword: password\n';

        // sn and cn are MUST attributes for the person objectClass - including givenName for completeness
        ldif += LDIFExporter.getAttributeLDIF('givenName', agencyUser.givenName);
        ldif += `sn: ${agencyUser.familyName}\n`;
        ldif += `cn: ${agencyUser.givenName} ${agencyUser.familyName}\n`;

        ldif += LDIFExporter.getAttributeLDIF(Headers.AgencyUserLoginId, uid);

        ldif += LDIFExporter.getAttributeLDIF(Headers.GivenName, agencyUser.givenName);
        ldif += LDIFExporter.getAttributeLDIF(Headers.FamilyName, agencyUser.familyName);
        ldif += LDIFExporter.getAttributeLDIF(Headers.AgencyUserAgency, agencyUser.agency);

        let programRoles: Array<string> = [];
        for (let programRole of agencyUser.programRoles) {
            programRoles.push(`${programRole.program}:${programRole.role}`);
        }

        if(programRoles.length > 0) {
            ldif += LDIFExporter.getAttributeLDIF(Headers.AgencyUserProgramRoles, programRoles.join(','));
        }

        return ldif += '\n';
    }

    public static getAttributeLDIF(attributeName: string, attributeValue: any): string {
        if (attributeValue !== undefined) {
            return `${attributeName}: ${attributeValue}\n`;
        }
        return '';
    }

}
