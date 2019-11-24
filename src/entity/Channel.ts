import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import Workspace from './Workspace';
import Message from './Message';

@Entity('channels')
class Channel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @OneToMany(
    () => Message,
    message => message.channel
  )
  messages: Message[];

  @Column('varchar')
  description: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column('boolean')
  public: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default Channel;
