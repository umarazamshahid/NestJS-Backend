import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserType } from "./user.schema.types";


@Schema({
    timestamps: true
})
export class User {

    @Prop({ required: true })
    userName: string

    @Prop({ required: true })
    userEmail: string

    @Prop()
    userAddress: string

    @Prop({ required: true })
    userCell: string

    @Prop({ required: true })
    userType: UserType

    @Prop({ default: null })
    userAvatar: string
}

export const UserSchema = SchemaFactory.createForClass(User)