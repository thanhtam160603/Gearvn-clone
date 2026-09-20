import { signInSchema } from "./sign-in-schema";

type StoredCredentialUser = {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    role: "CUSTOMER";
}
type Dependencies = {
    findUserByEmail: (email: string) => Promise<StoredCredentialUser | null>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
};
export async function authorizeCredentials(raw: unknown, deps: Dependencies) {
    const parsed = signInSchema.safeParse(raw);
    if(!parsed.success) return null;

    const user = await deps.findUserByEmail(parsed.data.email);
    if(!user) return null;

    const valid = await deps.verifyPassword(
        parsed.data.password, 
        user.passwordHash
    );
    if(!valid) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.displayName,
        displayName: user.displayName,
        role: user.role,
    };

}