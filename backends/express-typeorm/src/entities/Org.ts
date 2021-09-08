import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { OrgRole } from "./OrgRole";
import { Repo } from "./Repo";
import { RepoRole } from "./RepoRole";

@Entity()
export class Org {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    base_repo_role: string;

    @Column()
    billing_address: string;

    @OneToMany(() => Repo, repo => repo.org)
    repositories: Repo[]

    @OneToMany(() => OrgRole, org_role => org_role.org)
    orgRoles!: OrgRole[];
}
