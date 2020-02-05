import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { Channel, User } from '.';

@Entity('workspaces')
class Workspace extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(
    () => User,
    user => user.workspaces
  )
  teammates: User[];

  @ManyToOne(
    () => User,
    user => user.id
  )
  owner: User;

  @OneToMany(
    () => Channel,
    channel => channel.workspace
  )
  channels: Channel[];

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default Workspace;
