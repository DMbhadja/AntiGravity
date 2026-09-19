export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  averageSalary: number;
  departmentDistribution: { [key: string]: number };
  statusDistribution: { [key: string]: number };
}
