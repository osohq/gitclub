import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { CustomOrgRole, OrgRole } from "./OrgRole";
import { RepoRole } from "./RepoRole";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @OneToMany(() => RepoRole, repo_role => repo_role.user)
    repoRoles: RepoRole[];

    @OneToMany(() => OrgRole, org_role => org_role.user)
    orgRoles: OrgRole[];
}
