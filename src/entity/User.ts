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
  BeforeInsert,
} from 'typeorm';
import bcrypt from 'bcrypt';

import { Channel, DirectMessage, Workspace, Message } from '.';

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
    workspace => workspace.teammates
  )
  @JoinTable({
    name: 'user_workspaces',
    joinColumn: {
      name: 'user',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'workspace',
      referencedColumnName: 'id',
    },
  })
  workspaces: Workspace[];

  @OneToMany(
    () => Message,
    message => message.user
  )
  messages: Message[];

  @OneToMany(
    () => DirectMessage,
    directMessage => directMessage.user
  )
  directMessages: DirectMessage[];

  @ManyToMany(
    () => Channel,
    channel => channel.members
  )
  channels: Channel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  hashPassword = async () => {
    try {
      const hashedPassword = await bcrypt.hash(this.password, 12);
      this.password = hashedPassword;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('failed to hash password before inserting into db: ', e);
    }
  };
}

export default User;
