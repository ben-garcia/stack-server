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
  OneToMany,
} from 'typeorm';

import User from './User';
import Channel from './Channel';

@Entity('workspaces')
class Workspace extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToMany(
    () => Channel,
    channel => channel.workspace
  )
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default Workspace;
