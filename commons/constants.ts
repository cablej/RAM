export const Constants = {

    GlobalMessage: {
        DELEGATE_NOTIFIED: 'DELEGATE_NOTIFIED',
        DECLINED_RELATIONSHIP: 'DECLINED_RELATIONSHIP',
        ACCEPTED_RELATIONSHIP: 'ACCEPTED_RELATIONSHIP',
        CANCEL_ACCEPT_RELATIONSHIP: 'CANCEL_ACCEPT_RELATIONSHIP',
        INVALID_CODE: 'INVALID_CODE',
        SAVED_NOTIFICATION: 'SAVED_NOTIFICATION'
    },

    Link: {
        'SELF': 'self',
        'RELATIONSHIP_LIST': 'relationship-list',
        'RELATIONSHIP_CREATE': 'relationship-create',
        'ROLE_LIST': 'role-list',
        'ROLE_CREATE': 'role-create',
        'AUSKEY_LIST': 'auskey-list',
        'MODIFY': 'modify',
        'DELETE': 'delete',
        "NOTIFY": 'notify',
        'PRINT': 'print',
        'ACCEPT': 'accept',
        'REJECT': 'reject',
        'CLAIM': 'claim',
    },

    AUSkey: {
        DEVICE_TYPE: 'DEVICE'
    },

    PartyTypeCode: {
        INDIVIDUAL: 'INDIVIDUAL',
        ABN: 'ABN'
    },

    ProfileProviderCode: {
        INVITATION: 'INVITATION'
    },

    IdentityTypeCode: {
        INVITATION_CODE: 'INVITATION_CODE'
    },

    RelationshipTypeCategory: {
        AUTHORISATION: 'AUTHORISATION',
        NOTIFICATION: 'NOTIFICATION'
    },

    RelationshipInitiatedBy: {
        SUBJECT: 'SUBJECT',
        DELEGATE: 'DELEGATE'
    },

    RelationshipTypeCode: {
        OSP: 'OSP'
    },

    RelationshipStatusCode: {
        ACCEPTED: 'ACCEPTED',
        PENDING: 'PENDING'
    },

    RelationshipAttributeNameClassifier: {
        PERMISSION: 'PERMISSION',
        OTHER: 'OTHER'
    },

    RelationshipAttributeNameCode: {
        SSID: 'SSID',
        SELECTED_GOVERNMENT_SERVICES_LIST: 'SELECTED_GOVERNMENT_SERVICES_LIST',
        SUBJECT_RELATIONSHIP_TYPE_DECLARATION: 'SUBJECT_RELATIONSHIP_TYPE_DECLARATION',
        DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND: 'DELEGATE_MANAGE_AUTHORISATION_ALLOWED_IND',
        DELEGATE_MANAGE_AUTHORISATION_USER_CONFIGURABLE_IND: 'DELEGATE_MANAGE_AUTHORISATION_USER_CONFIGURABLE_IND',
        PERMISSION_CUSTOMISATION_ALLOWED_IND: 'PERMISSION_CUSTOMISATION_ALLOWED_IND',
        ACCESS_LEVELS_DESCRIPTION: 'ACCESS_LEVELS_DESCRIPTION',
        AUTOACCEPT_IF_INITIATED_FROM_DELEGATE_IND: 'AUTOACCEPT_IF_INITIATED_FROM_DELEGATE_IND',
        AUTOACCEPT_IF_INITIATED_FROM_SUBJECT_IND: 'AUTOACCEPT_IF_INITIATED_FROM_SUBJECT_IND',
        MANAGED_EXTERNALLY_IND: 'MANAGED_EXTERNALLY_IND',
        DELEGATE_EDIT_OWN_IND: 'DELEGATE_EDIT_OWN_IND'
    },

    RoleStatusCode: {
        ACTIVE: 'ACTIVE'
    },

    RoleTypeCode: {
        OSP: 'OSP'
    },

    RoleAttributeNameClassifier: {
        AGENCY_SERVICE: 'AGENCY_SERVICE',
        OTHER: 'OTHER'
    },

    RoleAttributeNameCode: {
        PREFERRED_NAME: 'PREFERRED_NAME',
        DEVICE_AUSKEYS: 'DEVICE_AUSKEYS'
    },

    SharedSecretCode: {
        DATE_OF_BIRTH: 'DATE_OF_BIRTH'
    }

};
