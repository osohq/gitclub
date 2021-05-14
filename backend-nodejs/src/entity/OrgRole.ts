import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Org } from "./Org";
import { User } from "./User";

@Entity()
export class OrgRole {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    role: string;

    @ManyToOne(() => Org, org => org.orgRoles)
    org: Org;

    @ManyToOne(() => User, user => user.orgRoles)
    user: User;
}
