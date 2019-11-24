import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';

import User from './User';

@Entity('workspaces')
class Workspace extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToMany(
    () => User,
    user => user.workspaces
  )
  @JoinTable()
  members: User[];

  @ManyToOne(
    () => User,
    user => user.workspaces
  )
  owner: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default Workspace;
