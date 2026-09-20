import NextAuth from 'next-auth';
import Credentials from "next-auth/providers/credentials";

import { authorizeCredentials } from '@/server/auth/authorize-credentials';
import { verifyPassword } from '@/server/auth/password';
import { prisma } from '@/server/db/prisma';

export const { handlers, auth, signIn, signOut} = NextAuth ({
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            authorize(credentials) {
                return authorizeCredentials(credentials, {
                    findUserByEmail(email) {
                        return prisma.user.findUnique({
                            where: { email },
                            select:{
                                id: true,
                                email: true,
                                hashedPassword: true,
                                displayName: true,
                                role: true
                            }
                        });
                    },
                    verifyPassword,
                });
                }
            }
        )
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
           if(user) {
                token.id = user.id;
                token.displayName = user.displayName;
                token.role = user.role;
            }
            if(trigger === "update" && user) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        email: true,
                        hashedPassword: true,
                        displayName: true,
                        role: true
                    }
                });

                if(freshUser) {
                    token.id = freshUser.id;
                    token.displayName = freshUser.displayName;
                    token.role = freshUser.role;
                }
            }

    }
})
