import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';

import { Message, User, Workspace } from '.';

@Entity('channels')
class Channel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Workspace,
    workspace => workspace.channels
  )
  workspace: Workspace;

  @OneToMany(
    () => Message,
    message => message.channel
  )
  messages: Message[];

  @ManyToMany(
    () => User,
    user => user.channels
  )
  @JoinTable({
    name: 'channel_members',
    joinColumn: {
      name: 'channel',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user',
      referencedColumnName: 'id',
    },
  })
  members: User[];

  @Column('varchar')
  description: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'boolean', default: true })
  private: boolean;

  @Column({ type: 'varchar', length: 100, default: '' })
  topic: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default Channel;
