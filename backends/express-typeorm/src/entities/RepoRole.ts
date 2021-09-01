import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Repo } from "./Repo";
import { User } from "./User";

@Entity()
export class RepoRole {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    role: string;

    @ManyToOne(() => Repo, repo => repo.repoRoles, { eager: true })
    repo: Repo;

    @Column({ nullable: true })
    repoId: number;

    @ManyToOne(() => User, user => user.repoRoles, { eager: true })
    user: User;

    @Column({ nullable: true })
    userId: number;

}
