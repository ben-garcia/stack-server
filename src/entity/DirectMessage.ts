import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import User from './User';

@Entity('direct_messages')
class DirectMessage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => User,
    user => user.messages
  )
  user: User;

  @Column()
  workspaceId: number;

  @Column('varchar')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default DirectMessage;
