import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';

import Workspace from './Workspace';
import Message from './Message';

@Entity('users')
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column('varchar')
  password: string;

  @ManyToMany(
    () => Workspace,
    workspace => workspace.members
  )
  @JoinTable()
  workspaces: Workspace[];

  @OneToMany(
    () => Message,
    message => message.user
  )
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default User;
