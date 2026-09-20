import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            email: string;
            name: string;
            displayName: string;
            role: "CUSTOMER";
        } & DefaultSession["user"];
    }
    interface User {
        displayName: string;
        role: "CUSTOMER";
    }
}
declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        displayName?: string;
        role?: "CUSTOMER";
    }
}