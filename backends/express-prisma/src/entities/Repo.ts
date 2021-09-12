import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Issue } from "./Issue";
import { Org } from "./Org";
import { RepoRole } from "./RepoRole";

@Entity()
export class Repo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Org, org => org.repositories)
    org: Org;


    @Column({ nullable: true })
    orgId: number;

    @OneToMany(() => Issue, issue => issue.repo)
    issues: Issue[]

    @OneToMany(() => RepoRole, repo_role => repo_role.repo)
    repoRoles!: RepoRole[];
}
