import { Department } from './department.model';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  status: EmployeeStatus;
  department: Department;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  status: string;
  departmentId: number;
  avatarUrl?: string;
}
