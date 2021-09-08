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
    repo: Repo;
    
    @Column({ nullable: true })
    repoId: number;
}
