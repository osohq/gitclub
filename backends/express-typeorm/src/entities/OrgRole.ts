import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Org } from "./Org";
import { User } from "./User";

@Entity()
export class OrgRole {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    role: string;

    @ManyToOne(() => Org, org => org.orgRoles, { eager: true })
    org: Org;

    @Column({ nullable: true })
    orgId: number;

    @ManyToOne(() => User, user => user.orgRoles, { eager: true })
    user: User;

    @Column({ nullable: true })
    userId: number;
}
