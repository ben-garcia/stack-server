import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import Workspace from './Workspace';

Entity('channels');
class Channel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace)
  workspaceId: number;

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
