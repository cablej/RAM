import * as mongoose from 'mongoose';
import * as colors from 'colors';
import {conf} from '../bootstrap';
import {doResetDataInMongo} from '../resetDataInMongo';
import {Constants} from '../../../commons/constants';

import {
    IRelationshipAttributeName,
    RelationshipAttributeNameModel,
    RelationshipAttributeNameDomain,
    RelationshipAttributeNameClassifier} from '../models/relationshipAttributeName.model';

import {
    IRelationshipAttributeNameUsage,
    RelationshipAttributeNameUsageModel} from '../models/relationshipAttributeNameUsage.model';

import {
    IRelationshipType,
    RelationshipTypeModel,
    RelationshipTypeCategory
} from '../models/relationshipType.model';

import {
    IRoleAttributeName,
    RoleAttributeNameModel,
    RoleAttributeNameDomain,
    RoleAttributeNameClassifier} from '../models/roleAttributeName.model';

import {
    IRoleAttributeNameUsage,
    RoleAttributeNameUsageModel} from '../models/roleAttributeNameUsage.model';

import {
    IRoleType,
    RoleTypeModel} from '../models/roleType.model';

import {
    ISharedSecretType,
    SharedSecretTypeModel,
    DOB_SHARED_SECRET_TYPE_CODE} from '../models/sharedSecretType.model';

import {
    ISharedSecret,
    SharedSecretModel} from '../models/sharedSecret.model';

import {
    ILegislativeProgram,
    LegislativeProgramModel} from '../models/legislativeProgram.model';

import {
    IName,
    NameModel} from '../models/name.model';

import {
    IProfile,
    ProfileModel} from '../models/profile.model';

import {
    IParty,
    PartyModel} from '../models/party.model';

import {
    IRole,
    RoleModel} from '../models/role.model';

import {
    IRoleAttribute,
    RoleAttributeModel} from '../models/roleAttribute.model';

import {
    IRelationship,
    RelationshipModel} from '../models/relationship.model';

import {
    IRelationshipAttribute,
    RelationshipAttributeModel} from '../models/relationshipAttribute.model';

import {
    IIdentity,
    IdentityModel} from '../models/identity.model';

import {LegislativeProgramsSeeder} from './seed-legislative-programs';

import {BobSmithIdentitySeeder} from './seed-bobsmith-identity';

import {CakeryBakeryIdentitySeeder} from './seed-cakerybakery-identity';
import {CakeryBakeryRelationshipsSeeder} from './seed-cakerybakery-relationships';

import {JMFoodPackagingIdentitySeeder} from './seed-jmfoodpackaging-identity';
import {JMFoodPackagingRelationshipsSeeder} from './seed-jmfoodpackaging-relationships';

import {JenniferMaximsIdentitySeeder} from './seed-jennifermaxims-identity';

import {JohnMaximsIdentitySeeder} from './seed-johnmaxims-identity';

import {JensCateringIdentitySeeder} from './seed-jenscatering-identity';
import {JensCateringRelationshipsSeeder} from './seed-jenscatering-relationships';

import {AgencyUsersSeeder} from './seed-agency-users';

import {LDIFExporter} from './ldifExporter';
import {EdTechOspRolesSeeder} from './seed-edtechosp-roles';
import {EdOanerIdentitySeeder} from './seed-edoaner-identity';
import {EdTechOSPIdentitySeeder} from './seed-edtechosp-identity';
import {EdTechOspRelationshipsSeeder} from './seed-edtechosp-relationships';
import {TrevorTrainingIdentitySeeder} from './seed-trevortraining-identity';
import {TrevorTrainingRelationshipsSeeder} from './seed-trevortraining-relationships';
import {TrungTrainingIdentitySeeder} from './seed-trungtraining-identity';
import {TrungTrainingRelationshipsSeeder} from './seed-trungtraining-relationships';
import {PattyPeacefulIdentitySeeder} from './seed-pattypeaceful-identity';
import {PeacefulGardenIdentitySeeder} from './seed-peacefulgarden-identity';
import {PeacefulGardenRelationshipsSeeder} from './seed-peacefulgarden-relationships';

const now = new Date();
now.setHours(0, 0, 0, 0);

const truncateString = (input:String):String => {
    return input && input.length > 60 ? (input.substring(0, 60) + '...') : input;
};

const getSubjectDeclaration = (): string => {
    return `### This is a sample declaration text for the subject
    
* written in **markdown**
* kept in database
* relationshipTypeUsage.defaultValue
* Use seed or admin UI to change it
    `;
};

const getDelegateDeclaration = (): string => {
    return `### This is a sample declaration text for the delegate
    
* written in **markdown**
* kept in database
* relationshipTypeUsage.defaultValue
* Use seed or admin UI to change it
    `;
};

// seeder .............................................................................................................

/* tslint:disable:no-any */
/* tslint:disable:max-func-body-length */
export class Seeder {

    public static now = now;

    private static verboseMode:boolean = true;
    private static exportLDIFMode:boolean = true;

    public static full_accessLevel = 'Full access';
    public static limited_accessLevel = 'Limited access';
    public static accessLevels = [Seeder.full_accessLevel, Seeder.limited_accessLevel];

    // relationship types
    public static associate_delegate_relationshipType:IRelationshipType;
    public static universal_delegate_relationshipType:IRelationshipType;
    public static custom_delegate_relationshipType:IRelationshipType;
    public static osp_delegate_relationshipType:IRelationshipType;

    // relationship attribute names (other)
    public static managedExternallyInd_relAttributeName:IRelationshipAttributeName;
    public static delegateEditOwnInd_relAttributeName:IRelationshipAttributeName;
    public static autoAcceptIfInitiatedFromDelegateInd_relAttributeName:IRelationshipAttributeName;
    public static autoAcceptIfInitiatedFromSubjectInd_relAttributeName:IRelationshipAttributeName;
    public static permissionCustomisationAllowedInd_relAttributeName:IRelationshipAttributeName;
    public static accessLevelsDescription_relAttributeName:IRelationshipAttributeName;
    public static delegateManageAuthorisationAllowedInd_relAttributeName:IRelationshipAttributeName;
    public static delegateManageAuthorisationUserConfigurableInd_relAttributeName:IRelationshipAttributeName;
    public static delegateRelationshipTypeDeclaration_relAttributeName:IRelationshipAttributeName;
    public static delegateRelationshipDeclaration_relAttributeName:IRelationshipAttributeName;
    public static subjectRelationshipTypeDeclaration_relAttributeName:IRelationshipAttributeName;
    public static subjectRelationshipDeclaration_relAttributeName:IRelationshipAttributeName;
    public static selectedGovernmentServicesList_relAttributeName:IRelationshipAttributeName; // for storing the selected services on an OSP relationship
    public static ssid_relAttributeName:IRelationshipAttributeName;

    // relationship attribute names (permission)
    public static taxSuperServices_relAttributeName:IRelationshipAttributeName;
    public static administrativeServices_relAttributeName:IRelationshipAttributeName;
    public static stateRevenueServices_relAttributeName:IRelationshipAttributeName;
    public static intermediariesAndQualifiedServices_relAttributeName:IRelationshipAttributeName;
    public static licenseAndRegistrationServices_relAttributeName:IRelationshipAttributeName;

    // role attribute names (other)
    public static ssid_roleAttributeName:IRoleAttributeName;
    public static preferredName_roleAttributeName:IRoleAttributeName;
    public static creatorId_roleAttributeName:IRoleAttributeName;
    public static creatorName_roleAttributeName:IRoleAttributeName;
    public static creatorAgency_roleAttributeName:IRoleAttributeName;
    public static deviceAuskeys_roleAttributeName:IRoleAttributeName;

    // role attribute names (agency service)
    public static usi_roleAttributeName:IRoleAttributeName;
    public static sbr_roleAttributeName:IRoleAttributeName;

    // role types
    public static osp_roleType:IRoleType;

    // shared secrets
    public static dob_sharedSecretType:ISharedSecretType;

    // legislative programs
    public static education_legislativeProgram:ILegislativeProgram;

    // individual identity
    public static bobsmith_name:IName;
    public static bobsmith_dob:ISharedSecret;
    public static bobsmith_profile:IProfile;
    public static bobsmith_party:IParty;
    public static bobsmith_identity_1:IIdentity;

    // individual identity
    public static edoaner_name:IName;
    public static edoaner_dob:ISharedSecret;
    public static edoaner_profile:IProfile;
    public static edoaner_party:IParty;
    public static edoaner_identity_1:IIdentity;

    // individual identity
    public static pattypeaceful_name:IName;
    public static pattypeaceful_dob:ISharedSecret;
    public static pattypeaceful_profile:IProfile;
    public static pattypeaceful_party:IParty;
    public static pattypeaceful_identity_1:IIdentity;

    // ABN identity
    public static edtechosp_name:IName;
    public static edtechosp_profile:IProfile;
    public static edtechosp_party:IParty;
    public static edtechosp_identity_1:IIdentity;

    // ABN identity
    public static peacefulgarden_name:IName;
    public static peacefulgarden_profile:IProfile;
    public static peacefulgarden_party:IParty;
    public static peacefulgarden_identity_1:IIdentity;

    // ABN identity
    public static trevortraining_name:IName;
    public static trevortraining_profile:IProfile;
    public static trevortraining_party:IParty;
    public static trevortraining_identity_1:IIdentity;

    // ABN identity
    public static trungtraining_name:IName;
    public static trungtraining_profile:IProfile;
    public static trungtraining_party:IParty;
    public static trungtraining_identity_1:IIdentity;

    // ABN identity
    public static cakerybakery_name:IName;
    public static cakerybakery_profile:IProfile;
    public static cakerybakery_party:IParty;
    public static cakerybakery_identity_1:IIdentity;

    // ABN identity
    public static jenscatering_name:IName;
    public static jenscatering_profile:IProfile;
    public static jenscatering_party:IParty;
    public static jenscatering_identity_1:IIdentity;

    // individual identity
    public static jmfoodpackaging_name:IName;
    public static jmfoodpackaging_profile:IProfile;
    public static jmfoodpackaging_party:IParty;
    public static jmfoodpackaging_identity_1:IIdentity;

    // individual identity
    public static jennifermaxims_name:IName;
    public static jennifermaxims_dob:ISharedSecret;
    public static jennifermaxims_profile:IProfile;
    public static jennifermaxims_party:IParty;
    public static jennifermaxims_identity_1:IIdentity;

    // individual identity
    public static johnmaxims_name:IName;
    public static johnmaxims_dob:ISharedSecret;
    public static johnmaxims_profile:IProfile;
    public static johnmaxims_party:IParty;
    public static johnmaxims_identity_1:IIdentity;

    // invitation identity
    public static robertsmith_name:IName;
    public static robertsmith_dob:ISharedSecret;
    public static robertsmith_profile:IProfile;
    public static robertsmith_party:IParty;
    public static robertsmith_identity_1:IIdentity;

    // invitation identity
    public static fredjohnson_name:IName;
    public static fredjohnson_dob:ISharedSecret;
    public static fredjohnson_profile:IProfile;
    public static fredjohnson_party:IParty;
    public static fredjohnson_identity_1:IIdentity;

    // relationships
    public static cakerybakery_and_jennifermaxims_relationship:IRelationship;
    public static jenscatering_and_jennifermaxims_relationship:IRelationship;
    public static jenscatering_and_edtech_relationship:IRelationship;
    public static jenscatering_and_johnmaxims_relationship:IRelationship;
    public static jenscatering_and_robertsmith_relationship:IRelationship;
    public static jenscatering_and_fredjohnson_relationship:IRelationship;
    public static jmfoodpackaging_and_jenscatering_relationship:IRelationship;
    public static edtechosp_and_edoaner_relationship:IRelationship;
    public static peacefulgarden_and_pattypeaceful_relationship:IRelationship;
    public static trevortraining_and_edtech_relationship:IRelationship;
    public static trungtraining_and_edtech_relationship:IRelationship;

    // roles
    public static edTech_osp_role:IRole;

    public static log(msg:String) {
        if(Seeder.verboseMode) {
            console.log(msg);
        }
    }

    public static async connectMongo() {
        await mongoose.connect(conf.mongoURL);
        Seeder.log(`\nConnected to the db: ${conf.mongoURL}`);
    }

    public static async connectIdentityExporters() {
        if(conf.exportLDIFFileName !== undefined) {
            await LDIFExporter.open(conf.exportLDIFFileName);
        } else {
          Seeder.exportLDIF(false);
        }
    }

    public static async resetDataInMongo() {
        if (conf.devMode) {
            Seeder.log('Dropping database in dev mode (starting fresh)');
            await doResetDataInMongo();
        } else {
            Seeder.log('Not dropping database in prod mode (appending)');
        }
    }

    public static async disconnect() {
        mongoose.connection.close();
    }

    public static async disconnectIdentityExporters() {
        if(Seeder.exportLDIFMode) {
            await LDIFExporter.close();
        }
    }

    public static verbose(verbose:boolean) {
        Seeder.verboseMode = verbose;
    }

    public static exportLDIF(exportLDIF:boolean) {
        Seeder.exportLDIFMode = exportLDIF;
    }

    public static async createRelationshipAttributeNameModel(values:IRelationshipAttributeName) {
        const code = values.code;
        const existingModel = await RelationshipAttributeNameModel.findByCodeIgnoringDateRange(code);
        if (existingModel === null) {
            Seeder.log(`- ${code}`.green);
            if (values.permittedValues) {
                for (let permittedValue of values.permittedValues) {
                    Seeder.log(colors.gray(`  - ${permittedValue}`));
                }
            }
            const model = await RelationshipAttributeNameModel.create(values);
            return model;
        } else {
            Seeder.log(`- ${code} ... skipped`.green);
            return existingModel;
        }
    }

    public static async createRelationshipAttributeNameUsageModels <T extends { attribute:IRelationshipAttributeName, optionalInd:boolean, defaultValue:string, sortOrder:number}>(attributeValues:T[]) {
        const attributeNameUsages:IRelationshipAttributeNameUsage[] = [];
        if (attributeValues) {
            for (let i = 0; i < attributeValues.length; i = i + 1) {
                const attributeValue = attributeValues[i];
                const truncatedDefaultValue = truncateString(attributeValue.defaultValue);
                Seeder.log(`  - ${attributeValue.sortOrder} ${attributeValue.attribute.code} (${truncatedDefaultValue})`.green);
                const attributeNameUsage = await RelationshipAttributeNameUsageModel.create({
                    attributeName: attributeValue.attribute,
                    optionalInd: attributeValue.optionalInd,
                    defaultValue: attributeValue.defaultValue,
                    sortOrder: attributeValue.sortOrder
                });
                attributeNameUsages.push(attributeNameUsage);
            }
        }
        return attributeNameUsages;
    }

    public static async createRelationshipTypeModel <T extends { attribute:IRelationshipAttributeName, optionalInd:boolean, defaultValue:string, sortOrder:number}>
    (values:IRelationshipType, attributeValues:T[]) {
        const code = values.code;
        const existingModel = await RelationshipTypeModel.findByCodeIgnoringDateRange(code);
        if (existingModel === null) {
            Seeder.log(`- ${code}`.magenta);
            values.attributeNameUsages = await Seeder.createRelationshipAttributeNameUsageModels(attributeValues);
            const model = await RelationshipTypeModel.create(values);
            Seeder.log('');
            return model;
        } else {
            Seeder.log(`- ${code} ... skipped`.magenta);
            return existingModel;
        }
    }

    public static async createRoleAttributeNameModel(values:IRoleAttributeName) {
        const code = values.code;
        const existingModel = await RoleAttributeNameModel.findByCodeIgnoringDateRange(code);
        if (existingModel === null) {
            Seeder.log(`- ${code}`.green);
            if (values.permittedValues) {
                for (let permittedValue of values.permittedValues) {
                    Seeder.log(colors.gray(`  - ${permittedValue}`));
                }
            }
            const model = await RoleAttributeNameModel.create(values);
            return model;
        } else {
            Seeder.log(`- ${code} ... skipped`.green);
            return existingModel;
        }
    }

    public static async createRoleAttributeNameUsageModels <T extends { attribute:IRoleAttributeName, optionalInd:boolean, defaultValue:string}>(attributeValues:T[]) {
        const attributeNameUsages:IRoleAttributeNameUsage[] = [];
        if (attributeValues) {
            for (let i = 0; i < attributeValues.length; i = i + 1) {
                const attributeValue = attributeValues[i];
                const truncatedDefaultValue = truncateString(attributeValue.defaultValue);
                Seeder.log(`  - ${attributeValue.attribute.code} (${truncatedDefaultValue})`.green);
                const attributeNameUsage = await RoleAttributeNameUsageModel.create({
                    attributeName: attributeValue.attribute,
                    optionalInd: attributeValue.optionalInd,
                    defaultValue: attributeValue.defaultValue
                });
                attributeNameUsages.push(attributeNameUsage);
            }
        }
        return attributeNameUsages;
    }

    public static async createRoleTypeModel <T extends { attribute: IRoleAttributeName, optionalInd: boolean, defaultValue: string}>(values: IRoleType, attributeValues: T[]) {
        const code = values.code;
        const existingModel = await RoleTypeModel.findByCodeIgnoringDateRange(code);
        if (existingModel === null) {
            Seeder.log(`- ${code}`.magenta);
            values.attributeNameUsages = await Seeder.createRoleAttributeNameUsageModels(attributeValues);
            const model = await RoleTypeModel.create(values);
            Seeder.log('');
            return model;
        } else {
            Seeder.log(`- ${code} ... skipped`.magenta);
            return existingModel;
        }
    }

    public static async createSharedSecretTypeModel(values:ISharedSecretType) {
        const code = values.code;
        const existingModel = await SharedSecretTypeModel.findByCodeIgnoringDateRange(code);
        if (existingModel === null) {
            Seeder.log(`- ${code}`.red);
            const model = await SharedSecretTypeModel.create(values);
            return model;
        } else {
            Seeder.log(`- ${code} ...`.red);
            return existingModel;
        }
    }

    public static async createSharedSecretModel(values:ISharedSecret) {
        Seeder.log(`- Secret    : ${values.sharedSecretType.code} (${values.value})`.cyan);
        const model = await SharedSecretModel.create(values);
        return model;
    }

    public static async createLegislativeProgramModel(values:ILegislativeProgram) {
        const code = values.code;
        const existingModel = await LegislativeProgramModel.findByCodeIgnoringDateRange(code);
        if (existingModel === null) {
            Seeder.log(`- ${code}`.red);
            const model = await LegislativeProgramModel.create(values);
            return model;
        } else {
            Seeder.log(`- ${code} ...`.red);
            return existingModel;
        }
    }

    public static async createNameModel(values:IName) {
        if (values.givenName || values.familyName) {
            Seeder.log(`- Name      : ${values.givenName} ${values.familyName}`.cyan);
        } else {
            Seeder.log(`- Name      : ${values.unstructuredName}`.cyan);
        }
        const model = await NameModel.create(values);
        return model;
    } 

    public static async createProfileModel(values:IProfile) {
        Seeder.log(`- Profile   : ${values.provider}`.cyan);
        const model = await ProfileModel.create(values);
        return model;
    }

    public static async createPartyModel(values:IParty) {
        Seeder.log(`- Party     : ${values.partyType}`.cyan);
        const model = await PartyModel.create(values);
        return model;
    }

    public static async createIdentityModel(values:IIdentity) {
        const model = await IdentityModel.create(values);
        Seeder.log(`- Identity  : ${model.idValue}`.cyan);
        Seeder.exportIdentity(model);
        return model;
    }

    public static async exportIdentity(identity:IIdentity) {
        if(Seeder.exportLDIFMode) {
            await LDIFExporter.exportIdentity(identity);
        }
    }

    public static async exportAgencyUsers() {
        if(Seeder.exportLDIFMode) {
            for (let agencyUser of AgencyUsersSeeder.all()) {
                await LDIFExporter.exportAgencyUser(agencyUser);
            }
        }
    }

    public static async createRelationshipAttributeModel(values:IRelationshipAttribute) {
        const model = await RelationshipAttributeModel.create(values);
        return model;
    }

    public static async createRelationshipModel(values:IRelationship) {
        Seeder.log(`- ${values.relationshipType.code}`.magenta);
        if (values.attributes) {
            for (let attribute of values.attributes) {
                let value:string[] = attribute.value;
                const truncatedValue = truncateString(value ? value.toString() : '');
                Seeder.log(`  - ${attribute.attributeName.code} (${truncatedValue})`.green);
            }
        }
        if (values.subjectNickName.givenName || values.subjectNickName.familyName) {
            Seeder.log(`  - Subject   : ${values.subjectNickName.givenName} ${values.subjectNickName.familyName}`.cyan);
        } else {
            Seeder.log(`  - Subject   : ${values.subjectNickName.unstructuredName}`.cyan);
        }
        if (values.subjectNickName.givenName || values.delegateNickName.familyName) {
            Seeder.log(`  - Delegate  : ${values.delegateNickName.givenName} ${values.delegateNickName.familyName}`.cyan);
        } else {
            Seeder.log(`  - Delegate  : ${values.delegateNickName.unstructuredName}`.cyan);
        }
        Seeder.log(`  - Start At  : ${values.startTimestamp}`.cyan);
        Seeder.log(`  - Status    : ${values.status}`.cyan);
        const model = await RelationshipModel.create(values);
        return model;
    }

    public static async createRoleAttributeModel(values:IRoleAttribute) {
        const model = await RoleAttributeModel.create(values);
        return model;
    }

    public static async createRoleModel(values:IRole) {
        Seeder.log(`- ${values.roleType.code}`.magenta);
        if (values.attributes) {
            for (let attribute of values.attributes) {
                let value:string[] = attribute.value;
                const truncatedValue = truncateString(value.toString());
                Seeder.log(`  - ${attribute.attributeName.code} (${truncatedValue})`.green);
            }
        }
        Seeder.log(`  - Start At  : ${values.startTimestamp}`.cyan);
        const model = await RoleModel.create(values);
        return model;
    }

    public static async loadRelationshipOtherAttributeNames() {
        try {

            Seeder.log('\nInserting Relationship Attribute Names (other):\n'.underline);

            Seeder.managedExternallyInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: Constants.RelationshipAttributeNameCode.MANAGED_EXTERNALLY_IND,
                shortDecodeText: 'External Truth Store Indicator',
                longDecodeText: 'External Truth Store Indicator',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether this relationship type is sourced from an external truth store',
                permittedValues: null,
                appliesToInstance: false
            } as any);

            Seeder.delegateEditOwnInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: Constants.RelationshipAttributeNameCode.DELEGATE_EDIT_OWN_IND,
                shortDecodeText: 'Delegate Edit Own Indicator',
                longDecodeText: 'Delegate Edit Own Indicator',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether this relationship type allows the delegate to edit their own instance',
                permittedValues: null,
                appliesToInstance: false
            } as any);

            Seeder.autoAcceptIfInitiatedFromDelegateInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: Constants.RelationshipAttributeNameCode.AUTOACCEPT_IF_INITIATED_FROM_DELEGATE_IND,
                shortDecodeText: 'Auto Accept If Initiated From Delegate Indicator',
                longDecodeText: 'Auto Accept If Initiated From Delegate Indicator',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether a relationship should be auto accepted if initiated from delegate',
                permittedValues: null,
                appliesToInstance: false
            } as any);

            Seeder.autoAcceptIfInitiatedFromSubjectInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: Constants.RelationshipAttributeNameCode.AUTOACCEPT_IF_INITIATED_FROM_SUBJECT_IND,
                shortDecodeText: 'Auto Accept If Initiated From Subject Indicator',
                longDecodeText: 'Auto Accept If Initiated From Subject Indicator',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether a relationship should be auto accepted if initiated from subject',
                permittedValues: null,
                appliesToInstance: false
            } as any);

            Seeder.permissionCustomisationAllowedInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'PERMISSION_CUSTOMISATION_ALLOWED_IND',
                shortDecodeText: 'Permission Customisation Allowed Indicator',
                longDecodeText: 'Permission Customisation Allowed Indicator',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether a relationship type allows the user to customise permission levels',
                permittedValues: null,
                appliesToInstance: false
            } as any);

            Seeder.accessLevelsDescription_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'ACCESS_LEVELS_DESCRIPTION',
                shortDecodeText: 'Access Levels description',
                longDecodeText: 'Full access: The agency service allows the representative access to all transactions without further steps. For more information see the detail for each service provided in the accordians below.',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Descriptive text to explain the permission attribute access levels',
                appliesToInstance: false
            } as any);

            Seeder.delegateManageAuthorisationAllowedInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: Constants.RelationshipAttributeNameCode.DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND,
                shortDecodeText: 'Do you want this representative to manage authorisations for this organisation?',
                longDecodeText: '(This includes the ability to create, view, modify and cancel authorisations)',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Boolean.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether a relationship allows the delegate to manage authorisations',
                appliesToInstance: true
            } as any);

            Seeder.delegateManageAuthorisationUserConfigurableInd_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'DELEGATE_MANAGE_AUTHORISATION_USER_CONFIGURABLE_IND',
                shortDecodeText: 'System indicator of whether the user can change the manage authorisations value',
                longDecodeText: 'System indicator of whether the user can change the manage authorisations value',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Null.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Indicator of whether the user can change the manage authorisations value (DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND)',
                appliesToInstance: false
            } as any);

            Seeder.delegateRelationshipTypeDeclaration_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'DELEGATE_RELATIONSHIP_TYPE_DECLARATION',
                shortDecodeText: 'Delegate Relationship Type Declaration',
                longDecodeText: 'Delegate Relationship Type Declaration',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Markdown.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Delegate specific declaration in Markdown for a relationship type',
                appliesToInstance: false
            } as any);

            Seeder.delegateRelationshipDeclaration_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'DELEGATE_RELATIONSHIP_DECLARATION',
                shortDecodeText: 'Delegate Relationship Declaration Record',
                longDecodeText: 'Delegate Relationship Declaration Record',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Markdown.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'A record of the delegate specific declaration in Markdown that was accepted by the user',
                appliesToInstance: true
            } as any);

            Seeder.subjectRelationshipTypeDeclaration_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'SUBJECT_RELATIONSHIP_TYPE_DECLARATION',
                shortDecodeText: 'Subject Relationship Type Declaration',
                longDecodeText: 'Subject Relationship Type Declaration',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Markdown.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Subject specific declaration in Markdown for a relationship type',
                appliesToInstance: false
            } as any);

            Seeder.subjectRelationshipDeclaration_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'SUBJECT_RELATIONSHIP_DECLARATION',
                shortDecodeText: 'Subject Relationship Declaration Record',
                longDecodeText: 'Subject Relationship Declaration Record',
                startDate: now,
                domain: RelationshipAttributeNameDomain.Markdown.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'A record of the subject specific declaration in Markdown that was accepted by the user',
                appliesToInstance: true
            } as any);

            Seeder.ssid_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'SSID',
                shortDecodeText: 'Software serial number',
                longDecodeText: 'Software serial number',
                startDate: now,
                domain: RelationshipAttributeNameDomain.String.code,
                classifier: RelationshipAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Software serial number',
                appliesToInstance: true
            } as any);

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async loadRelationshipPermissionAttributeNames() {
        try {

            Seeder.log('\nInserting Relationship Attribute Names (permission):\n'.underline);

            const permissionServices_category = 'Permission Services';

            Seeder.taxSuperServices_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'TAX_AND_SUPER_SERVICES_PERMISSION',
                shortDecodeText: 'Tax and Super Services',
                longDecodeText: 'Tax and Super Services',
                startDate: now,
                domain: RelationshipAttributeNameDomain.SelectSingle.code,
                classifier: RelationshipAttributeNameClassifier.Permission.code,
                category: permissionServices_category,
                purposeText: 'A permission for a relationship',
                permittedValues: Seeder.accessLevels,
                appliesToInstance: true
            } as any);

            Seeder.administrativeServices_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'ADMINISTRATIVE_SERVICES_PERMISSION',
                shortDecodeText: 'Administrative Services',
                longDecodeText: 'Activate',
                startDate: now,
                domain: RelationshipAttributeNameDomain.SelectSingle.code,
                classifier: RelationshipAttributeNameClassifier.Permission.code,
                category: permissionServices_category,
                purposeText: 'A permission for a relationship',
                permittedValues: Seeder.accessLevels,
                appliesToInstance: true
            } as any);

            Seeder.stateRevenueServices_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'STATE_REVENUE_SERVICES_PERMISSION',
                shortDecodeText: 'State Revenue Services',
                longDecodeText: 'State Revenue Services',
                startDate: now,
                domain: RelationshipAttributeNameDomain.SelectSingle.code,
                classifier: RelationshipAttributeNameClassifier.Permission.code,
                category: permissionServices_category,
                purposeText: 'A permission for a relationship',
                permittedValues: Seeder.accessLevels,
                appliesToInstance: true
            } as any);

            Seeder.intermediariesAndQualifiedServices_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'INTERMEDIARIES_AND_QUALIFIED_SERVICES_PERMISSION',
                shortDecodeText: 'Intermediaries and Qualified Services',
                longDecodeText: 'Intermediaries and Qualified Services',
                startDate: now,
                domain: RelationshipAttributeNameDomain.SelectSingle.code,
                classifier: RelationshipAttributeNameClassifier.Permission.code,
                category: permissionServices_category,
                purposeText: 'A permission for a relationship',
                permittedValues: Seeder.accessLevels,
                appliesToInstance: true
            } as any);

            Seeder.licenseAndRegistrationServices_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'LICENSE_AND_REGISTRATION_SERVICES_PERMISSION',
                shortDecodeText: 'License and Registration Services',
                longDecodeText: 'License and Registration Services',
                startDate: now,
                domain: RelationshipAttributeNameDomain.SelectSingle.code,
                classifier: RelationshipAttributeNameClassifier.Permission.code,
                category: permissionServices_category,
                purposeText: 'A permission for a relationship',
                permittedValues: Seeder.accessLevels,
                appliesToInstance: true
            } as any);

            const ospServices_category = 'OSP Services';

            Seeder.selectedGovernmentServicesList_relAttributeName = await Seeder.createRelationshipAttributeNameModel({
                code: 'SELECTED_GOVERNMENT_SERVICES_LIST',
                shortDecodeText: 'Selected Services for OSP',
                longDecodeText: 'Selected Services for OSP',
                startDate: now,
                domain: RelationshipAttributeNameDomain.SelectMulti.code,
                classifier: RelationshipAttributeNameClassifier.AgencyService.code,
                category: ospServices_category,
                purposeText: 'Selected Services for OSP',
                permittedValues: null,
                appliesToInstance: true
            } as any);

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async loadRoleAttributeNames() {
        try {

            Seeder.log('\nInserting Role Attribute Names:\n'.underline);

            Seeder.ssid_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'SSID',
                shortDecodeText: 'SSID',
                longDecodeText: 'Software serial number',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Software serial number',
                appliesToInstance: true
            } as any);

            Seeder.usi_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'USI',
                shortDecodeText: 'Unique Student Identifier (USI)',
                longDecodeText: 'Unique Student Identifier (USI)',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.AgencyService.code,
                category: 'EDUCATION',
                purposeText: 'Unique Student Identifier (USI)',
                appliesToInstance: true
            } as any);

            Seeder.sbr_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'SBR',
                shortDecodeText: 'Standard Business Reporting (SBR) - ATO',
                longDecodeText: 'Standard Business Reporting (SBR) - ATO',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.AgencyService.code,
                category: 'TAX',
                purposeText: 'Standard Business Reporting (SBR) - ATO',
                appliesToInstance: true
            } as any);

            Seeder.preferredName_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'PREFERRED_NAME',
                shortDecodeText: 'Preferred Name',
                longDecodeText: 'Preferred Name',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Preferred Name',
                appliesToInstance: true
            } as any);

            Seeder.creatorId_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'CREATOR_ID',
                shortDecodeText: 'Creator Id',
                longDecodeText: 'Creator Id',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Creator Id',
                appliesToInstance: true
            } as any);

            Seeder.creatorName_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'CREATOR_NAME',
                shortDecodeText: 'Creator Name',
                longDecodeText: 'Creator Name',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Creator Name',
                appliesToInstance: true
            } as any);

            Seeder.creatorAgency_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'CREATOR_AGENCY',
                shortDecodeText: 'Creator Agency',
                longDecodeText: 'Creator Agency',
                startDate: now,
                domain: RoleAttributeNameDomain.String.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Creator Agency',
                appliesToInstance: true
            } as any);

            Seeder.deviceAuskeys_roleAttributeName = await Seeder.createRoleAttributeNameModel({
                code: 'DEVICE_AUSKEYS',
                shortDecodeText: 'Device Auskeys',
                longDecodeText: 'Device Auskeys',
                startDate: now,
                domain: RoleAttributeNameDomain.SelectMulti.code,
                classifier: RoleAttributeNameClassifier.Other.code,
                category: null,
                purposeText: 'Device Auskeys',
                appliesToInstance: true
            } as any);

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async loadRelationshipTypes() {
        try {

            Seeder.log('\nInserting Relationship Types:\n'.underline);

            Seeder.associate_delegate_relationshipType = await Seeder.createRelationshipTypeModel({
                code: 'ASSOCIATE',
                shortDecodeText: 'Associate',
                longDecodeText: 'Associate',
                startDate: now,
                strength: 200,
                minIdentityStrength: 2,
                category: RelationshipTypeCategory.Authorisation.code
            } as any, [
                {attribute: Seeder.managedExternallyInd_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.delegateEditOwnInd_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.permissionCustomisationAllowedInd_relAttributeName, optionalInd: false, defaultValue: 'false', sortOrder: 1},
                {attribute: Seeder.accessLevelsDescription_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName, optionalInd: false, defaultValue: 'true', sortOrder: 2},
                {attribute: Seeder.delegateRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 3},
                {attribute: Seeder.delegateRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getDelegateDeclaration(), sortOrder: 3},
                {attribute: Seeder.subjectRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 4},
                {attribute: Seeder.subjectRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getSubjectDeclaration(), sortOrder: 4},
                {attribute: Seeder.taxSuperServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 5},
                {attribute: Seeder.administrativeServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 6},
                {attribute: Seeder.stateRevenueServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 7},
                {attribute: Seeder.intermediariesAndQualifiedServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 8},
                {attribute: Seeder.licenseAndRegistrationServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 9}
            ]);

            Seeder.universal_delegate_relationshipType = await Seeder.createRelationshipTypeModel({
                code: 'UNIVERSAL_REPRESENTATIVE',
                shortDecodeText: 'Universal Representative',
                longDecodeText: 'The same level of authorisation as an Associate of the organisation (e.g., Owner, Director). All permissions will be defaulted to maximum access.',
                startDate: now,
                strength: 200,
                minIdentityStrength: 2,
                category: RelationshipTypeCategory.Authorisation.code
            } as any, [
                {attribute: Seeder.delegateEditOwnInd_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.permissionCustomisationAllowedInd_relAttributeName, optionalInd: false, defaultValue: 'false', sortOrder: 1},
                {attribute: Seeder.accessLevelsDescription_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName, optionalInd: false, defaultValue: 'true', sortOrder: 2},
                {attribute: Seeder.delegateRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 3},
                {attribute: Seeder.delegateRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getDelegateDeclaration(), sortOrder: 3},
                {attribute: Seeder.subjectRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 4},
                {attribute: Seeder.subjectRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getSubjectDeclaration(), sortOrder: 4},
                {attribute: Seeder.taxSuperServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 5},
                {attribute: Seeder.administrativeServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 6},
                {attribute: Seeder.stateRevenueServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 7},
                {attribute: Seeder.intermediariesAndQualifiedServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 8},
                {attribute: Seeder.licenseAndRegistrationServices_relAttributeName, optionalInd: false, defaultValue: Seeder.full_accessLevel, sortOrder: 9}
            ]);

            Seeder.custom_delegate_relationshipType = await Seeder.createRelationshipTypeModel({
                code: 'CUSTOM_REPRESENTATIVE',
                shortDecodeText: 'Custom Representative',
                longDecodeText: `Select the representative authorisation type if you want to customise access.
                Select which permissions this representative will have, including restricting access to some services.`,
                startDate: now,
                strength: 100,
                minIdentityStrength: 1,
                category: RelationshipTypeCategory.Authorisation.code
            } as any, [
                {attribute: Seeder.permissionCustomisationAllowedInd_relAttributeName, optionalInd: false, defaultValue: 'true', sortOrder: 1},
                {attribute: Seeder.accessLevelsDescription_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.delegateManageAuthorisationAllowedInd_relAttributeName, optionalInd: false, defaultValue: 'false', sortOrder: 2},
                {attribute: Seeder.delegateManageAuthorisationUserConfigurableInd_relAttributeName, optionalInd: false, defaultValue: 'false', sortOrder: -1},
                {attribute: Seeder.delegateRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 3},
                {attribute: Seeder.delegateRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getDelegateDeclaration(), sortOrder: 3},
                {attribute: Seeder.subjectRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 4},
                {attribute: Seeder.subjectRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getSubjectDeclaration(), sortOrder: 4},
                {attribute: Seeder.taxSuperServices_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 5},
                {attribute: Seeder.administrativeServices_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 6},
                {attribute: Seeder.stateRevenueServices_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 7},
                {attribute: Seeder.intermediariesAndQualifiedServices_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 8},
                {attribute: Seeder.licenseAndRegistrationServices_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 9}
            ]);

            Seeder.osp_delegate_relationshipType = await Seeder.createRelationshipTypeModel({
                code: 'OSP',
                shortDecodeText: 'Online Software Provider',
                longDecodeText: 'Online Software Provider',
                startDate: now,
                minIdentityStrength: 0,
                category: RelationshipTypeCategory.Notification.code
            } as any, [
                {attribute: Seeder.autoAcceptIfInitiatedFromSubjectInd_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.selectedGovernmentServicesList_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 1},
                {attribute: Seeder.ssid_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 2},
                {attribute: Seeder.subjectRelationshipDeclaration_relAttributeName, optionalInd: false, defaultValue: null, sortOrder: 3},
                {attribute: Seeder.subjectRelationshipTypeDeclaration_relAttributeName, optionalInd: false, defaultValue: getSubjectDeclaration(), sortOrder: 3}
            ]);

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async loadRoleTypes() {
        try {

            Seeder.log('\nInserting Role Types:\n'.underline);

            Seeder.osp_roleType = await Seeder.createRoleTypeModel({
                code: 'OSP',
                shortDecodeText: 'Online Software Provider',
                longDecodeText: 'Online Software Provider',
                startDate: now
            } as any, [
                {attribute: Seeder.ssid_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.usi_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.sbr_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.preferredName_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.creatorId_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.creatorName_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.creatorAgency_roleAttributeName, optionalInd: false, defaultValue: null},
                {attribute: Seeder.deviceAuskeys_roleAttributeName, optionalInd: false, defaultValue: null}
            ]);

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static async loadSharedSecretTypes() {
        try {

            Seeder.log('\nInserting Shared Secret Types:\n'.underline);

            Seeder.dob_sharedSecretType = await Seeder.createSharedSecretTypeModel({
                code: DOB_SHARED_SECRET_TYPE_CODE,
                shortDecodeText: 'Date of Birth',
                longDecodeText: 'Date of Birth',
                startDate: now,
                domain: 'DEFAULT'
            } as any);

        } catch (e) {
            Seeder.log('Seeding failed!');
            Seeder.log(e);
        }
    }

    public static reload() {
        return Seeder.connectMongo()
            .then(Seeder.resetDataInMongo)
            .then(Seeder.loadReference)
            .then(Seeder.loadMock)
            .then(Seeder.disconnect);
    }

    public static loadReference() {
        return Promise.resolve(null)
            .then(Seeder.loadRelationshipOtherAttributeNames)
            .then(Seeder.loadRelationshipPermissionAttributeNames)
            .then(Seeder.loadRelationshipTypes)
            .then(Seeder.loadRoleAttributeNames)
            .then(Seeder.loadRoleTypes)
            .then(Seeder.loadSharedSecretTypes)
            .then(LegislativeProgramsSeeder.load);
    }

    public static loadMock() {

        return Promise.resolve(null)

            .then(Seeder.connectIdentityExporters)

            // identities
            .then(BobSmithIdentitySeeder.load)
            .then(EdOanerIdentitySeeder.load)
            .then(PattyPeacefulIdentitySeeder.load)
            .then(EdTechOSPIdentitySeeder.load)
            .then(PeacefulGardenIdentitySeeder.load)
            .then(CakeryBakeryIdentitySeeder.load)
            .then(JenniferMaximsIdentitySeeder.load)
            .then(JohnMaximsIdentitySeeder.load)
            .then(JMFoodPackagingIdentitySeeder.load)
            .then(JensCateringIdentitySeeder.load)
            .then(TrevorTrainingIdentitySeeder.load)
            .then(TrungTrainingIdentitySeeder.load)

            // relationships
            .then(CakeryBakeryRelationshipsSeeder.load)
            .then(JensCateringRelationshipsSeeder.load)
            .then(JMFoodPackagingRelationshipsSeeder.load)
            .then(EdTechOspRelationshipsSeeder.load)
            .then(PeacefulGardenRelationshipsSeeder.load)
            .then(TrevorTrainingRelationshipsSeeder.load)
            .then(TrungTrainingRelationshipsSeeder.load)

            // roles
            .then(EdTechOspRolesSeeder.load)

            // agency users
            .then(Seeder.exportAgencyUsers)

            .then(Seeder.disconnectIdentityExporters);

    }

}
