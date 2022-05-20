import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
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

@Entity()
export class CustomOrgRole {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Org, org => org.customOrgRoles, { eager: true })
    org: Org;

    @Column({ nullable: true })
    orgId: number;

    @OneToMany(() => OrgRolePermission, permission => permission.role, { eager: true })
    permissionAssignments: OrgRolePermission[]

    @OneToMany(() => OrgRoleUser, userAssignment => userAssignment.role, { eager: true })
    userAssignments: OrgRoleUser[]
}

@Entity()
export class OrgRolePermission {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CustomOrgRole, role => role.permissionAssignments)
    role: CustomOrgRole;

    @Column({ nullable: true })
    roleId: number;

    @Column()
    permission: string
}

@Entity()
export class OrgRoleUser {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CustomOrgRole, role => role.permissionAssignments)
    role: CustomOrgRole;

    @Column({ nullable: true })
    roleId: number;

    @ManyToOne(() => User, { eager: true })
    user: User

    @Column({ nullable: true })
    userId: number;
}
