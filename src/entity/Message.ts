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
import Channel from './Channel';

@Entity('messages')
class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => User,
    user => user.messages
  )
  user: User;

  @ManyToOne(
    () => Channel,
    channel => channel.messages
  )
  channel: Channel;

  @Column('varchar')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default Message;
