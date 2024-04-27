import { UserType } from "../schema/user.schema.types";

export class UserDTO {
    readonly userName: string;
    readonly userEmail: string;
    readonly userAddress: string;
    readonly userCell: string;
    readonly userType: UserType;
    readonly userAvatar: string;
}