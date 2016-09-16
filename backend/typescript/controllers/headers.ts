export class Headers {

    public static Prefix = `x-ram`;

    public static AuthToken = `${Headers.Prefix}-auth-token`;
    public static AuthTokenDecoded = `${Headers.Prefix}-auth-token-decoded`;

    public static AuthAUSkey = `${Headers.Prefix}-auth-auskey`;

    // todo overall security enforcer need to accommodate the presence of this header (VANGUARD, ABR, AUSKEY truth stores)
    // which act as a trusted party with set permissions
    public static ClientAuth = `${Headers.Prefix}-clientauth`;

    public static Principal = `${Headers.Prefix}-principal`;
    public static PrincipalIdValue = `${Headers.Prefix}-principal-idvalue`;

    public static Identity = `${Headers.Prefix}-identity`;
    public static IdentityIdValue = `${Headers.Prefix}-identity-idvalue`;
    public static IdentityRawIdValue = `${Headers.Prefix}-identity-rawidvalue`;
    public static IdentityType = `${Headers.Prefix}-identitytype`;
    public static IdentityStrength = `${Headers.Prefix}-identitystrength`;

    public static AgencyUser = `${Headers.Prefix}-agencyuser`;
    public static AgencyUserLoginId = `${Headers.Prefix}-agencyuser-loginid`;
    public static AgencyUserProgramRoles = `${Headers.Prefix}-agencyuser-programroles`;
    public static AgencyUserAgency = `${Headers.Prefix}-agencyuser-agency`;

    public static CredentialType = `${Headers.Prefix}-credentialtype`;
    public static CredentialStrength = `${Headers.Prefix}-credentialstrength`;

    public static ABN = `${Headers.Prefix}-abn`;

    public static PartyType = `${Headers.Prefix}-partytype`;

    public static GivenName = `${Headers.Prefix}-givenname`;
    public static FamilyName = `${Headers.Prefix}-familyname`;
    public static UnstructuredName = `${Headers.Prefix}-unstructuredname`;
    public static DOB = `${Headers.Prefix}-dob`;
    public static EMAIL = `${Headers.Prefix}-email`;

    public static ProfileProvider = `${Headers.Prefix}-profileprovider`;

    public static AgencyScheme = `${Headers.Prefix}-programscheme`;
    public static AgencyToken = `${Headers.Prefix}-programtoken`;
    public static LinkIdScheme = `${Headers.Prefix}-linkidscheme`;
    public static LinkIdConsumer = `${Headers.Prefix}-linkidconsumer`;
    public static PublicIdentifierScheme = `${Headers.Prefix}-publicidentifierscheme`;

    public static isXRAMHeader(headerName: string) {
        return headerName.toLowerCase().startsWith(Headers.Prefix);
    }
}