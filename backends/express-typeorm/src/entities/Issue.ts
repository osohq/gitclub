import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm";
import { Org } from "./Org";
import { Repo } from "./Repo";

@Entity()
export class Issue {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => Repo, repo => repo.issues)
    @JoinColumn({ name: "repository_id" })
    repo: Repo;
}
