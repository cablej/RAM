import {Permission, Permissions} from '../dtos/permission.dto';
import {Constants} from '../constants';

// todo descriptions to be filled out

export const RelationshipCanViewPermission = new Permission(
    'relationship-can-view',
    'A relationship can be viewed if the parties it is associated with have access.',
    false,
    Constants.Link.SELF
);

export const RelationshipCanModifyPermission = new Permission(
    'relationship-can-modify',
    'A relationship can be modified if it is new or if it hasn\'t yet been accepted.',
    false,
    Constants.Link.MODIFY
);

export const RelationshipCanClaimPermission = new Permission(
    'relationship-can-claim',
    'A relationship can be viewed if the parties it is associated with have access.',
    false,
    Constants.Link.CLAIM
);

export const RelationshipCanAcceptPermission = new Permission(
    'relationship-can-accept',
    'A relationship can be accepted if the party accepting it is the assigned delegate and they are authenticated with the required identity strength.',
    false,
    Constants.Link.ACCEPT
);

export const RelationshipCanRejectPermission = new Permission(
    'relationship-can-reject',
    'A relationship can be reject if the party rejecting is the assigned delegate.',
    false,
    Constants.Link.REJECT
);

export const RelationshipCanNotifyDelegatePermission = new Permission(
    'relationship-can-notify',
    'A relationship delegate can be notified if the relationship is pending.',
    false,
    Constants.Link.NOTIFY
);

export const RelationshipCanPrintInvitationPermission = new Permission(
    'relationship-can-print-invitation',
    'A relationship invitation can be printed if the relationship is pending.',
    false,
    Constants.Link.PRINT
);

export const RelationshipCanEditDelegatePermission = new Permission(
    'relationship-can-edit-delegate',
    'A relationship delegate can only be edited on initial creation or for pending invitations.',
    true
);

export const RelationshipCanViewDobPermission = new Permission(
    'relationship-can-view-dob',
    'A relationship dob can only be viewed on initial creation.',
    true
);

export const Relationships = new Permissions()
        .push(RelationshipCanViewPermission)
        .push(RelationshipCanModifyPermission)
        .push(RelationshipCanClaimPermission)
        .push(RelationshipCanAcceptPermission)
        .push(RelationshipCanRejectPermission)
        .push(RelationshipCanNotifyDelegatePermission)
        .push(RelationshipCanPrintInvitationPermission)
        .push(RelationshipCanEditDelegatePermission)
        .push(RelationshipCanViewDobPermission)
    ;
