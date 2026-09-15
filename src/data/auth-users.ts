import type { AuthUser, MockUser } from "@/types/auth";

export const mockUsers = [
  {
    id: "user-demo",
    email: "demo@gearvn.local",
    password: "Demo@123",
    displayName: "Demo Customer",
    role: "customer",
    phone: "",
    birthDate: "",
  },
  {
    id: "user-customer",
    email: "customer@gearvn.local",
    password: "Customer@123",
    displayName: "GearVN Customer",
    role: "customer",
    phone: "",
    birthDate: "",
  },
] satisfies MockUser[];

export function toAuthUser(user: MockUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    phone: user.phone,
    birthDate: user.birthDate,
  };
}
