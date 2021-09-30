import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm";
import { Org } from "./Org";
import { Repo } from "./Repo";
import { User } from "./User";

@Entity()
export class Issue {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ default: false })
    closed: boolean;

    @ManyToOne(() => Repo, repo => repo.issues)
    repo: Repo;

    @Column({ nullable: true })
    repoId: number;

    @ManyToOne(() => User)
    creator: User;

    @Column()
    creatorId: number;
}
